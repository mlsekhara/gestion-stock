import { useState } from "react";
import { Button, Card, Space, Table, Tag, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import type { ColumnsType } from "antd/es/table";
import { listerMouvements, type Mouvement, type TypeMouvement } from "@/api/stock";
import MouvementModal from "@/components/MouvementModal";

const ETIQUETTE: Record<TypeMouvement, { txt: string; couleur: string }> = {
  entree: { txt: "Entrée", couleur: "green" },
  sortie: { txt: "Sortie", couleur: "red" },
  ajustement: { txt: "Ajustement", couleur: "blue" },
  transfert: { txt: "Transfert", couleur: "purple" },
};

export default function MouvementsPage() {
  const [open, setOpen] = useState(false);
  const { data: mouvements = [], isFetching } = useQuery({ queryKey: ["mouvements"], queryFn: listerMouvements });

  const colonnes: ColumnsType<Mouvement> = [
    {
      title: "Date",
      dataIndex: "created_at",
      width: 160,
      render: (v) => new Date(v).toLocaleString("fr-FR"),
    },
    {
      title: "Type",
      dataIndex: "type",
      width: 120,
      render: (t: TypeMouvement) => <Tag color={ETIQUETTE[t].couleur}>{ETIQUETTE[t].txt}</Tag>,
    },
    { title: "Article", dataIndex: "article_designation" },
    { title: "Quantité", dataIndex: "quantite", width: 110, align: "right" },
    {
      title: "Coût unit.",
      dataIndex: "cout_unitaire",
      width: 110,
      align: "right",
      render: (v) => (v != null ? Number(v).toLocaleString("fr-FR") : "—"),
    },
    { title: "Motif", dataIndex: "motif", render: (v) => v ?? "—" },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Mouvements de stock
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          Nouveau mouvement
        </Button>
      </div>

      <Card variant="borderless">
        <Table
          rowKey="id"
          size="middle"
          loading={isFetching}
          columns={colonnes}
          dataSource={mouvements}
          scroll={{ x: 800 }}
          pagination={{ pageSize: 15, showSizeChanger: false }}
        />
      </Card>

      <MouvementModal open={open} onClose={() => setOpen(false)} />
    </Space>
  );
}
