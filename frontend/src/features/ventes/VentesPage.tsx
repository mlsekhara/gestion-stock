import { useState } from "react";
import { Button, Card, Col, Form, InputNumber, Input, List, Modal, Row, Select, Space, Statistic, Table, Tag, Typography, Popconfirm, App } from "antd";
import { PlusOutlined, CheckCircleOutlined, DollarOutlined, DeleteOutlined, ShoppingOutlined, RiseOutlined, LineChartOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnsType } from "antd/es/table";
import {
  kpisVentes,
  listerVentes,
  validerVente,
  ajouterPaiementVente,
  supprimerVente,
  type Vente,
  type TypeVente,
  type StatutVente,
} from "@/api/ventes";
import { useAuthStore } from "@/store/auth";
import VenteForm from "./VenteForm";

const fmt = (v: number) => Number(v).toLocaleString("fr-FR");

const TYPE_TAG: Record<TypeVente, { txt: string; couleur: string }> = {
  facture: { txt: "Facture", couleur: "blue" },
  proforma: { txt: "Proforma", couleur: "default" },
  retour: { txt: "Retour", couleur: "purple" },
};
const STATUT_TAG: Record<StatutVente, { txt: string; couleur: string }> = {
  brouillon: { txt: "Brouillon", couleur: "gold" },
  validee: { txt: "Validée", couleur: "green" },
  annulee: { txt: "Annulée", couleur: "red" },
};

function VentesKpis() {
  const devise = useAuthStore((s) => s.utilisateur?.entreprise.devise ?? "DA");
  const { data } = useQuery({ queryKey: ["kpis-ventes"], queryFn: kpisVentes });
  const cartes = [
    { titre: "Nombre de ventes", valeur: data?.nb_ventes ?? 0, icone: <ShoppingOutlined />, couleur: "#1677ff" },
    { titre: `Chiffre d'affaires (${devise})`, valeur: Number(data?.chiffre_affaires ?? 0), icone: <RiseOutlined />, couleur: "#52c41a" },
    { titre: `Marge (${devise})`, valeur: Number(data?.marge ?? 0), icone: <LineChartOutlined />, couleur: "#722ed1" },
    { titre: `Panier moyen (${devise})`, valeur: Number(data?.panier_moyen ?? 0), icone: <ShoppingCartOutlined />, couleur: "#fa8c16" },
  ];
  return (
    <Row gutter={[16, 16]}>
      {cartes.map((c) => (
        <Col xs={12} md={6} key={c.titre}>
          <Card variant="borderless">
            <Statistic title={c.titre} value={c.valeur} groupSeparator=" " prefix={<span style={{ color: c.couleur }}>{c.icone}</span>} />
          </Card>
        </Col>
      ))}
    </Row>
  );
}

function PaiementModal({ vente, onClose }: { vente: Vente | null; onClose: () => void }) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const { message } = App.useApp();
  const mutation = useMutation({
    mutationFn: (v: any) => ajouterPaiementVente(vente!.id, v),
    onSuccess: () => {
      message.success("Paiement enregistré");
      qc.invalidateQueries({ queryKey: ["ventes"] });
      onClose();
    },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? "Erreur"),
  });
  return (
    <Modal
      title={vente ? `Encaissement — ${vente.reference}` : ""}
      open={!!vente}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      okText="Enregistrer"
      cancelText="Annuler"
      destroyOnHidden
    >
      {vente && <Typography.Paragraph type="secondary">Reste à payer : <strong>{fmt(vente.reste_a_payer)}</strong></Typography.Paragraph>}
      <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate(v)} initialValues={{ methode: "espèces", montant: vente?.reste_a_payer }}>
        <Form.Item name="montant" label="Montant" rules={[{ required: true }]}>
          <InputNumber min={0.01} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="methode" label="Méthode">
          <Select options={["espèces", "virement", "chèque", "carte"].map((m) => ({ value: m, label: m }))} />
        </Form.Item>
        <Form.Item name="note" label="Note">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default function VentesPage() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const devise = useAuthStore((s) => s.utilisateur?.entreprise.devise ?? "DA");
  const [formOpen, setFormOpen] = useState(false);
  const [paiement, setPaiement] = useState<Vente | null>(null);

  const { data: ventes = [], isFetching } = useQuery({ queryKey: ["ventes"], queryFn: listerVentes });

  const invalider = () => {
    qc.invalidateQueries({ queryKey: ["ventes"] });
    qc.invalidateQueries({ queryKey: ["kpis-ventes"] });
    qc.invalidateQueries({ queryKey: ["articles"] });
    qc.invalidateQueries({ queryKey: ["kpis-stock"] });
  };

  const validation = useMutation({
    mutationFn: validerVente,
    onSuccess: () => { message.success("Vente validée"); invalider(); },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? "Erreur"),
  });
  const suppression = useMutation({
    mutationFn: supprimerVente,
    onSuccess: () => { message.success("Supprimé"); invalider(); },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? "Erreur"),
  });

  const colonnes: ColumnsType<Vente> = [
    { title: "Référence", dataIndex: "reference", width: 110 },
    { title: "Type", dataIndex: "type", width: 110, render: (t: TypeVente) => <Tag color={TYPE_TAG[t].couleur}>{TYPE_TAG[t].txt}</Tag> },
    { title: "Client", dataIndex: "client_nom", render: (v) => v ?? "—" },
    { title: "Date", dataIndex: "created_at", width: 110, render: (v) => new Date(v).toLocaleDateString("fr-FR") },
    { title: "Statut", dataIndex: "statut", width: 110, render: (s: StatutVente) => <Tag color={STATUT_TAG[s].couleur}>{STATUT_TAG[s].txt}</Tag> },
    { title: `Total (${devise})`, dataIndex: "montant_total", width: 110, align: "right", render: fmt },
    { title: `Marge (${devise})`, dataIndex: "marge_totale", width: 110, align: "right", render: (v) => (Number(v) ? fmt(v) : "—") },
    {
      title: `Reste (${devise})`,
      dataIndex: "reste_a_payer",
      width: 110,
      align: "right",
      render: (v) => <span style={{ color: Number(v) > 0 ? "#ff4d4f" : "#52c41a" }}>{fmt(v)}</span>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 220,
      align: "right",
      render: (_, v) => (
        <Space>
          {v.statut === "brouillon" && (
            <Popconfirm title="Valider ? Le stock sera mis à jour." okText="Oui" cancelText="Non" onConfirm={() => validation.mutate(v.id)}>
              <Button size="small" type="primary" icon={<CheckCircleOutlined />}>Valider</Button>
            </Popconfirm>
          )}
          {v.type !== "proforma" && (
            <Button size="small" icon={<DollarOutlined />} disabled={v.reste_a_payer <= 0} onClick={() => setPaiement(v)}>
              Encaisser
            </Button>
          )}
          {v.statut !== "validee" && (
            <Popconfirm title="Supprimer ?" okText="Oui" cancelText="Non" onConfirm={() => suppression.mutate(v.id)}>
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
        <Typography.Title level={3} style={{ margin: 0 }}>Ventes</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setFormOpen(true)}>
          Nouvelle vente
        </Button>
      </div>

      <VentesKpis />

      <Card variant="borderless">
        <Table
          rowKey="id"
          loading={isFetching}
          columns={colonnes}
          dataSource={ventes}
          scroll={{ x: 1100 }}
          expandable={{
            expandedRowRender: (v) => (
              <Space direction="vertical" style={{ width: "100%" }}>
                <Table
                  rowKey="id"
                  size="small"
                  pagination={false}
                  dataSource={v.lignes}
                  columns={[
                    { title: "Article", dataIndex: "article_designation" },
                    { title: "Qté", dataIndex: "quantite", align: "right", width: 80 },
                    { title: "Prix unit.", dataIndex: "prix_unitaire", align: "right", width: 110, render: fmt },
                    { title: "Montant", dataIndex: "montant", align: "right", width: 110, render: fmt },
                  ]}
                />
                {v.paiements.length > 0 && (
                  <List
                    size="small"
                    header={<Typography.Text strong>Encaissements</Typography.Text>}
                    dataSource={v.paiements}
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

      <VenteForm open={formOpen} onClose={() => setFormOpen(false)} />
      <PaiementModal vente={paiement} onClose={() => setPaiement(null)} />
    </Space>
  );
}
