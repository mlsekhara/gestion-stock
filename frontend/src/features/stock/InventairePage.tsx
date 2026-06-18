import { useEffect, useState } from "react";
import { Button, Card, Input, InputNumber, Modal, Space, Table, Tag, Typography, App } from "antd";
import { PlusOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnsType } from "antd/es/table";
import { listerArticles, type Article } from "@/api/catalogue";
import { creerInventaire, listerInventaires, validerInventaire, type Inventaire, type InventaireLigne } from "@/api/stock";

function CountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [note, setNote] = useState("");
  const [comptes, setComptes] = useState<Record<number, number>>({});
  const { data: articles = [] } = useQuery({ queryKey: ["articles", ""], queryFn: () => listerArticles(), enabled: open });

  useEffect(() => {
    if (open) {
      setNote("");
      setComptes({});
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: () =>
      creerInventaire({
        note: note || undefined,
        lignes: (articles as Article[]).map((a) => ({
          article_id: a.id,
          quantite_comptee: comptes[a.id] ?? Number(a.quantite),
        })),
      }),
    onSuccess: () => {
      message.success("Inventaire créé");
      qc.invalidateQueries({ queryKey: ["inventaires"] });
      onClose();
    },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? "Erreur"),
  });

  const colonnes: ColumnsType<Article> = [
    { title: "Référence", dataIndex: "reference", width: 130 },
    { title: "Désignation", dataIndex: "designation" },
    { title: "Théorique", dataIndex: "quantite", width: 100, align: "right" },
    {
      title: "Compté",
      key: "compte",
      width: 130,
      render: (_, a) => (
        <InputNumber
          style={{ width: "100%" }}
          value={comptes[a.id] ?? Number(a.quantite)}
          min={0}
          onChange={(v) => setComptes((c) => ({ ...c, [a.id]: Number(v ?? 0) }))}
        />
      ),
    },
  ];

  return (
    <Modal
      title="Nouvel inventaire (comptage)"
      open={open}
      onCancel={onClose}
      onOk={() => mutation.mutate()}
      confirmLoading={mutation.isPending}
      okText="Créer l'inventaire"
      cancelText="Annuler"
      width={720}
    >
      <Input placeholder="Note (optionnel)" value={note} onChange={(e) => setNote(e.target.value)} style={{ marginBottom: 12 }} />
      <Table rowKey="id" size="small" columns={colonnes} dataSource={articles} pagination={{ pageSize: 8 }} scroll={{ x: 600 }} />
    </Modal>
  );
}

export default function InventairePage() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const { data: inventaires = [], isFetching } = useQuery({ queryKey: ["inventaires"], queryFn: listerInventaires });

  const validation = useMutation({
    mutationFn: validerInventaire,
    onSuccess: () => {
      message.success("Inventaire validé — stock ajusté");
      qc.invalidateQueries({ queryKey: ["inventaires"] });
      qc.invalidateQueries({ queryKey: ["articles"] });
      qc.invalidateQueries({ queryKey: ["kpis-stock"] });
    },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? "Erreur"),
  });

  const colonnes: ColumnsType<Inventaire> = [
    { title: "Référence", dataIndex: "reference", width: 120 },
    { title: "Date", dataIndex: "created_at", width: 160, render: (v) => new Date(v).toLocaleString("fr-FR") },
    {
      title: "Statut",
      dataIndex: "statut",
      width: 120,
      render: (s) => <Tag color={s === "valide" ? "success" : "default"}>{s === "valide" ? "Validé" : "Brouillon"}</Tag>,
    },
    { title: "Lignes", key: "nb", width: 90, align: "center", render: (_, i) => i.lignes.length },
    { title: "Note", dataIndex: "note", render: (v) => v ?? "—" },
    {
      title: "Actions",
      key: "actions",
      width: 130,
      align: "right",
      render: (_, i) =>
        i.statut === "brouillon" ? (
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            loading={validation.isPending}
            onClick={() => validation.mutate(i.id)}
          >
            Valider
          </Button>
        ) : null,
    },
  ];

  const ligneColonnes: ColumnsType<InventaireLigne> = [
    { title: "Article", dataIndex: "article_designation" },
    { title: "Théorique", dataIndex: "quantite_theorique", align: "right", width: 110 },
    { title: "Compté", dataIndex: "quantite_comptee", align: "right", width: 110 },
    {
      title: "Écart",
      dataIndex: "ecart",
      align: "right",
      width: 110,
      render: (v) => {
        const n = Number(v);
        return <Tag color={n === 0 ? "default" : n > 0 ? "green" : "red"}>{n > 0 ? `+${n}` : n}</Tag>;
      },
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Inventaire
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          Nouvel inventaire
        </Button>
      </div>

      <Card variant="borderless">
        <Table
          rowKey="id"
          loading={isFetching}
          columns={colonnes}
          dataSource={inventaires}
          scroll={{ x: 800 }}
          expandable={{
            expandedRowRender: (inv) => (
              <Table
                rowKey="id"
                size="small"
                columns={ligneColonnes}
                dataSource={inv.lignes.filter((l) => Number(l.ecart) !== 0)}
                pagination={false}
                locale={{ emptyText: "Aucun écart" }}
              />
            ),
          }}
        />
      </Card>

      <CountModal open={open} onClose={() => setOpen(false)} />
    </Space>
  );
}
