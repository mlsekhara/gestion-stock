import { useState } from "react";
import { Button, Card, Form, InputNumber, Input, Modal, Select, Space, Table, Tag, Typography, Popconfirm, App, List } from "antd";
import { PlusOutlined, DownloadOutlined, DollarOutlined, DeleteOutlined, PrinterOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnsType } from "antd/es/table";
import {
  listerAchats,
  receptionnerAchat,
  ajouterPaiement,
  supprimerAchat,
  type Achat,
  type StatutAchat,
} from "@/api/achats";
import { useAuthStore } from "@/store/auth";
import AchatForm from "./AchatForm";
import { imprimerDocument } from "@/utils/imprimerDocument";

const STATUT: Record<StatutAchat, { txt: string; couleur: string }> = {
  commande: { txt: "Commande", couleur: "gold" },
  recue: { txt: "Réceptionnée", couleur: "green" },
  annulee: { txt: "Annulée", couleur: "red" },
};

const fmt = (v: number) => Number(v).toLocaleString("fr-FR");

function PaiementModal({ achat, onClose }: { achat: Achat | null; onClose: () => void }) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const { message } = App.useApp();
  const mutation = useMutation({
    mutationFn: (v: any) => ajouterPaiement(achat!.id, v),
    onSuccess: () => {
      message.success("Paiement enregistré");
      qc.invalidateQueries({ queryKey: ["achats"] });
      onClose();
    },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? "Erreur"),
  });

  return (
    <Modal
      title={achat ? `Paiement — ${achat.reference}` : ""}
      open={!!achat}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      okText="Enregistrer"
      cancelText="Annuler"
      destroyOnHidden
    >
      {achat && (
        <Typography.Paragraph type="secondary">
          Reste à payer : <strong>{fmt(achat.reste_a_payer)}</strong>
        </Typography.Paragraph>
      )}
      <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate(v)} initialValues={{ methode: "espèces", montant: achat?.reste_a_payer }}>
        <Form.Item name="montant" label="Montant" rules={[{ required: true }]}>
          <InputNumber min={0.01} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="methode" label="Méthode">
          <Select
            options={["espèces", "virement", "chèque", "carte"].map((m) => ({ value: m, label: m }))}
          />
        </Form.Item>
        <Form.Item name="note" label="Note">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default function AchatsPage() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const devise = useAuthStore((s) => s.utilisateur?.entreprise.devise ?? "DA");
  const [formOpen, setFormOpen] = useState(false);
  const [paiement, setPaiement] = useState<Achat | null>(null);

  const { data: achats = [], isFetching } = useQuery({ queryKey: ["achats"], queryFn: listerAchats });

  const invalider = () => {
    qc.invalidateQueries({ queryKey: ["achats"] });
    qc.invalidateQueries({ queryKey: ["articles"] });
    qc.invalidateQueries({ queryKey: ["kpis-stock"] });
  };

  const reception = useMutation({
    mutationFn: receptionnerAchat,
    onSuccess: () => { message.success("Réceptionné — stock mis à jour"); invalider(); },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? "Erreur"),
  });
  const suppression = useMutation({
    mutationFn: supprimerAchat,
    onSuccess: () => { message.success("Supprimé"); invalider(); },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? "Erreur"),
  });

  const entreprise = useAuthStore((s) => s.utilisateur?.entreprise);

  function imprimer(a: Achat) {
    imprimerDocument({
      type: "bon_achat",
      reference: a.reference,
      date: new Date(a.created_at).toLocaleDateString("fr-FR"),
      entreprise: { nom: entreprise?.nom ?? "", adresse: "Alger, Algérie" },
      tiers: a.fournisseur_nom ? { label: "Fournisseur", nom: a.fournisseur_nom } : null,
      lignes: a.lignes.map((l) => ({
        designation: l.article_designation ?? "—",
        quantite: Number(l.quantite),
        prix_unitaire: Number(l.cout_unitaire),
        montant: Number(l.montant),
      })),
      montant_total: Number(a.montant_total),
      montant_paye: Number(a.montant_paye),
      reste_a_payer: Number(a.reste_a_payer),
      devise,
      note: a.note ?? undefined,
    });
  }

  const colonnes: ColumnsType<Achat> = [
    { title: "Référence", dataIndex: "reference", width: 110 },
    { title: "Fournisseur", dataIndex: "fournisseur_nom", render: (v) => v ?? "—" },
    { title: "Date", dataIndex: "created_at", width: 120, render: (v) => new Date(v).toLocaleDateString("fr-FR") },
    { title: "Statut", dataIndex: "statut", width: 130, render: (s: StatutAchat) => <Tag color={STATUT[s].couleur}>{STATUT[s].txt}</Tag> },
    { title: `Total (${devise})`, dataIndex: "montant_total", width: 120, align: "right", render: fmt },
    {
      title: `Reste (${devise})`,
      dataIndex: "reste_a_payer",
      width: 120,
      align: "right",
      render: (v) => <span style={{ color: Number(v) > 0 ? "#ff4d4f" : "#52c41a" }}>{fmt(v)}</span>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 280,
      align: "right",
      render: (_, a) => (
        <Space wrap>
          <Button size="small" icon={<PrinterOutlined />} onClick={() => imprimer(a)}>Imprimer</Button>
          {a.statut === "commande" && (
            <Popconfirm title="Réceptionner ? Le stock sera mis à jour." okText="Oui" cancelText="Non" onConfirm={() => reception.mutate(a.id)}>
              <Button size="small" type="primary" icon={<DownloadOutlined />}>Réceptionner</Button>
            </Popconfirm>
          )}
          <Button size="small" icon={<DollarOutlined />} disabled={a.reste_a_payer <= 0} onClick={() => setPaiement(a)}>
            Payer
          </Button>
          {a.statut !== "recue" && (
            <Popconfirm title="Supprimer ce bon ?" okText="Oui" cancelText="Non" onConfirm={() => suppression.mutate(a.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Achats</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setFormOpen(true)}>
          Nouveau bon d'achat
        </Button>
      </div>

      <Card variant="borderless">
        <Table
          rowKey="id"
          loading={isFetching}
          columns={colonnes}
          dataSource={achats}
          scroll={{ x: 1000 }}
          expandable={{
            expandedRowRender: (a) => (
              <Space direction="vertical" style={{ width: "100%" }}>
                <Table
                  rowKey="id"
                  size="small"
                  pagination={false}
                  dataSource={a.lignes}
                  columns={[
                    { title: "Article", dataIndex: "article_designation" },
                    { title: "Qté", dataIndex: "quantite", align: "right", width: 90 },
                    { title: "Coût unit.", dataIndex: "cout_unitaire", align: "right", width: 110, render: fmt },
                    { title: "Montant", dataIndex: "montant", align: "right", width: 120, render: fmt },
                  ]}
                />
                {a.paiements.length > 0 && (
                  <List
                    size="small"
                    header={<Typography.Text strong>Paiements</Typography.Text>}
                    dataSource={a.paiements}
                    renderItem={(p) => (
                      <List.Item>
                        {new Date(p.created_at).toLocaleDateString("fr-FR")} — {fmt(p.montant)} {devise} ({p.methode})
                      </List.Item>
                    )}
                  />
                )}
              </Space>
            ),
          }}
        />
      </Card>

      <AchatForm open={formOpen} onClose={() => setFormOpen(false)} />
      <PaiementModal achat={paiement} onClose={() => setPaiement(null)} />
    </Space>
  );
}
