import { useMemo, useState, useRef, useEffect } from "react";
import { Button, Card, Input, InputNumber, Select, Space, Table, Tag, Typography, Popconfirm, App, Tooltip, Upload } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, SwapOutlined, ReloadOutlined, DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnsType } from "antd/es/table";
import { listerArticles, supprimerArticle, modifierArticle, importerArticlesCSV, refApi, type Article } from "@/api/catalogue";
import { useAuthStore } from "@/store/auth";
import StockKpis from "./StockKpis";
import ArticleForm from "./ArticleForm";
import MouvementModal from "@/components/MouvementModal";
import { exporterCSV } from "@/utils/exportExcel";

function badgeQuantite(a: Article) {
  const q = Number(a.quantite);
  const seuil = Number(a.seuil_alerte);
  const qAffiche = q.toLocaleString("fr-FR");
  if (q <= 0) return <Tag color="error">Rupture (0)</Tag>;
  if (seuil > 0 && q <= seuil) return <Tag color="warning">{`${qAffiche} (alerte)`}</Tag>;
  return <Tag color="success">{qAffiche}</Tag>;
}

function EditablePrice({ value, articleId, field, onSaved }: {
  value: number;
  articleId: number;
  field: string;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const inputRef = useRef<any>(null);
  const { message } = App.useApp();

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const save = async () => {
    setEditing(false);
    if (val === value) return;
    try {
      await modifierArticle(articleId, { [field]: val });
      onSaved();
    } catch (e: any) {
      message.error(e?.response?.data?.detail ?? "Erreur");
    }
  };

  if (!editing) {
    return (
      <div
        onDoubleClick={() => { setVal(value); setEditing(true); }}
        style={{ cursor: "pointer", padding: "2px 4px", borderRadius: 4, minHeight: 22 }}
        title="Double-cliquer pour modifier"
      >
        {Number(value).toLocaleString("fr-FR")}
      </div>
    );
  }

  return (
    <InputNumber
      ref={inputRef}
      size="small"
      min={0}
      value={val}
      onChange={(v) => setVal(v ?? 0)}
      onBlur={save}
      onPressEnter={save}
      style={{ width: "100%" }}
    />
  );
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

  const refresh = () => qc.invalidateQueries({ queryKey: ["articles"] });

  const colonnes: ColumnsType<Article> = useMemo(
    () => [
      { title: "Référence", dataIndex: "reference", width: 120 },
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
      { title: "Qté", dataIndex: "quantite", width: 110, align: "center", render: (_, a) => badgeQuantite(a) },
      {
        title: `Achat moy.`,
        dataIndex: "prix_achat_moyen",
        width: 105,
        align: "right",
        render: (v, a) => <EditablePrice value={Number(v)} articleId={a.id} field="prix_achat_moyen" onSaved={refresh} />,
      },
      {
        title: `Détail`,
        dataIndex: "prix_vente",
        width: 95,
        align: "right",
        render: (v, a) => <EditablePrice value={Number(v)} articleId={a.id} field="prix_vente" onSaved={refresh} />,
      },
      {
        title: `Gros`,
        dataIndex: "prix_vente_gros",
        width: 95,
        align: "right",
        render: (v, a) => <EditablePrice value={Number(v)} articleId={a.id} field="prix_vente_gros" onSaved={refresh} />,
      },
      {
        title: `Super gros`,
        dataIndex: "prix_vente_super_gros",
        width: 100,
        align: "right",
        render: (v, a) => <EditablePrice value={Number(v)} articleId={a.id} field="prix_vente_super_gros" onSaved={refresh} />,
      },
      {
        title: "Actions",
        key: "actions",
        width: 140,
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
        <Space>
          <Upload
            accept=".csv"
            showUploadList={false}
            beforeUpload={(file) => {
              importerArticlesCSV(file).then((res) => {
                message.success(`Import terminé : ${res.crees} créés, ${res.ignores} ignorés`);
                if (res.erreurs.length) message.warning(res.erreurs.join(", "));
                qc.invalidateQueries({ queryKey: ["articles"] });
              }).catch((e: any) => message.error(e?.response?.data?.detail ?? "Erreur import"));
              return false;
            }}
          >
            <Button icon={<UploadOutlined />}>Import CSV</Button>
          </Upload>
          <Button icon={<DownloadOutlined />} onClick={() => {
            exporterCSV("articles", ["Réf", "Désignation", "Famille", "Marque", "Qté", "Prix achat", "Prix vente", "Seuil alerte"],
              articles.map((a) => [a.reference, a.designation, a.famille_nom ?? "", a.marque_nom ?? "", Number(a.quantite), Number(a.prix_achat_moyen), Number(a.prix_vente), Number(a.seuil_alerte)])
            );
          }}>Export CSV</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEdite(null); setFormOpen(true); }}>
            Nouvel article
          </Button>
        </Space>
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

        <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8, fontSize: 12 }}>
          Double-cliquer sur un prix pour le modifier directement.
        </Typography.Text>

        <Table
          rowKey="id"
          size="middle"
          loading={isFetching}
          columns={colonnes}
          dataSource={articles}
          scroll={{ x: 1050 }}
          pagination={{ pageSize: 12, showSizeChanger: false }}
        />
      </Card>

      <ArticleForm open={formOpen} article={edite} onClose={() => setFormOpen(false)} />
      <MouvementModal open={!!mvtArticle} article={mvtArticle} onClose={() => setMvtArticle(null)} />
    </Space>
  );
}
