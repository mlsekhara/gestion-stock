import { useMemo, useState } from "react";
import { Button, Card, Input, Select, Space, Table, Tag, Typography, Popconfirm, App, Tooltip } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, SwapOutlined, ReloadOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnsType } from "antd/es/table";
import { listerArticles, supprimerArticle, refApi, type Article } from "@/api/catalogue";
import { useAuthStore } from "@/store/auth";
import StockKpis from "./StockKpis";
import ArticleForm from "./ArticleForm";
import MouvementModal from "@/components/MouvementModal";

function badgeQuantite(a: Article) {
  // Les Decimal sont sérialisés en chaînes par l'API → convertir en nombre.
  const q = Number(a.quantite);
  const seuil = Number(a.seuil_alerte);
  const qAffiche = q.toLocaleString("fr-FR");
  if (q <= 0) return <Tag color="error">Rupture (0)</Tag>;
  if (seuil > 0 && q <= seuil) return <Tag color="warning">{`${qAffiche} (alerte)`}</Tag>;
  return <Tag color="success">{qAffiche}</Tag>;
}

export default function ArticlesPage() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const devise = useAuthStore((s) => s.utilisateur?.entreprise.devise ?? "DA");
  const [q, setQ] = useState("");
  const [familleId, setFamilleId] = useState<number | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [edite, setEdite] = useState<Article | null>(null);
  const [mvtArticle, setMvtArticle] = useState<Article | null>(null);

  const { data: familles = [] } = useQuery({ queryKey: ["familles"], queryFn: refApi("familles").lister });
  const { data: articles = [], isFetching } = useQuery({
    queryKey: ["articles", q, familleId],
    queryFn: () => listerArticles({ q: q || undefined, famille_id: familleId }),
  });

  const suppression = useMutation({
    mutationFn: supprimerArticle,
    onSuccess: () => {
      message.success("Article supprimé");
      qc.invalidateQueries({ queryKey: ["articles"] });
      qc.invalidateQueries({ queryKey: ["kpis-stock"] });
    },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? "Suppression impossible"),
  });

  const colonnes: ColumnsType<Article> = useMemo(
    () => [
      { title: "Référence", dataIndex: "reference", width: 130 },
      {
        title: "Désignation",
        dataIndex: "designation",
        render: (v, a) => (
          <Space direction="vertical" size={0}>
            <span>{v}</span>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {[a.marque_nom, a.famille_nom].filter(Boolean).join(" · ")}
              {a.suivi_serie ? "  •  IMEI/série" : ""}
            </Typography.Text>
          </Space>
        ),
      },
      { title: "Quantité", dataIndex: "quantite", width: 130, align: "center", render: (_, a) => badgeQuantite(a) },
      {
        title: `P. vente (${devise})`,
        dataIndex: "prix_vente",
        width: 120,
        align: "right",
        render: (v) => Number(v).toLocaleString("fr-FR"),
      },
      {
        title: `P. achat moy. (${devise})`,
        dataIndex: "prix_achat_moyen",
        width: 140,
        align: "right",
        render: (v) => Number(v).toLocaleString("fr-FR"),
      },
      {
        title: "Actions",
        key: "actions",
        width: 150,
        align: "right",
        render: (_, a) => (
          <Space>
            <Tooltip title="Mouvement de stock">
              <Button size="small" icon={<SwapOutlined />} onClick={() => setMvtArticle(a)} />
            </Tooltip>
            <Tooltip title="Modifier">
              <Button size="small" icon={<EditOutlined />} onClick={() => { setEdite(a); setFormOpen(true); }} />
            </Tooltip>
            <Popconfirm title="Supprimer cet article ?" okText="Oui" cancelText="Non" onConfirm={() => suppression.mutate(a.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [devise, suppression],
  );

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Liste des produits
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEdite(null); setFormOpen(true); }}>
          Nouvel article
        </Button>
      </div>

      <StockKpis />

      <Card variant="borderless">
        <Space style={{ marginBottom: 16, flexWrap: "wrap" }}>
          <Input.Search
            placeholder="Rechercher (désignation, référence, code-barres)"
            allowClear
            onSearch={setQ}
            onChange={(e) => !e.target.value && setQ("")}
            style={{ width: 320 }}
          />
          <Select
            allowClear
            placeholder="Toutes les familles"
            style={{ width: 200 }}
            value={familleId}
            onChange={setFamilleId}
            options={familles.map((f) => ({ value: f.id, label: f.nom }))}
          />
          <Button icon={<ReloadOutlined />} onClick={() => qc.invalidateQueries({ queryKey: ["articles"] })}>
            Actualiser
          </Button>
        </Space>

        <Table
          rowKey="id"
          size="middle"
          loading={isFetching}
          columns={colonnes}
          dataSource={articles}
          scroll={{ x: 900 }}
          pagination={{ pageSize: 12, showSizeChanger: false }}
        />
      </Card>

      <ArticleForm open={formOpen} article={edite} onClose={() => setFormOpen(false)} />
      <MouvementModal open={!!mvtArticle} article={mvtArticle} onClose={() => setMvtArticle(null)} />
    </Space>
  );
}
