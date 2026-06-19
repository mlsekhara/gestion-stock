import { useEffect, useState } from "react";
import { Modal, Form, Select, Input, InputNumber, Button, DatePicker, Space, Typography, App, Divider, Row, Col } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listerArticles, creerArticle, modifierArticle, type Article } from "@/api/catalogue";
import { tiersApi } from "@/api/tiers";
import { creerAchat } from "@/api/achats";
import QuickAddDropdown from "@/components/QuickAddDropdown";

export default function AchatForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const { message } = App.useApp();

  const { data: fournisseurs = [] } = useQuery({ queryKey: ["fournisseurs"], queryFn: () => tiersApi("fournisseurs").lister() });
  const { data: articles = [] } = useQuery({ queryKey: ["articles", ""], queryFn: () => listerArticles(), enabled: open });

  useEffect(() => {
    if (open) form.resetFields();
  }, [open, form]);

  const mutation = useMutation({
    mutationFn: creerAchat,
    onSuccess: () => {
      message.success("Bon d'achat créé");
      qc.invalidateQueries({ queryKey: ["achats"] });
      onClose();
    },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? "Erreur"),
  });

  const addFournisseur = useMutation({
    mutationFn: (nom: string) => tiersApi("fournisseurs").creer({ nom }),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["fournisseurs"] });
      form.setFieldValue("fournisseur_id", created.id);
      message.success("Fournisseur ajouté");
    },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? "Erreur"),
  });

  const addArticle = useMutation({
    mutationFn: (vals: { reference: string; designation: string }) =>
      creerArticle({ reference: vals.reference, designation: vals.designation, actif: true }),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["articles"] });
      message.success("Article ajouté");
      return created;
    },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? "Erreur"),
  });

  function onFinish(v: any) {
    mutation.mutate({
      fournisseur_id: v.fournisseur_id ?? null,
      note: v.note,
      echeance: v.echeance ? v.echeance.toISOString() : null,
      lignes: (v.lignes ?? []).map((l: any) => ({
        article_id: l.article_id,
        quantite: l.quantite,
        cout_unitaire: l.cout_unitaire,
      })),
    });
  }

  const articleOptions = (articles as Article[]).map((a) => ({ value: a.id, label: `${a.reference} — ${a.designation}` }));

  return (
    <Modal
      title="Nouveau bon d'achat"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      okText="Créer la commande"
      cancelText="Annuler"
      width={760}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ lignes: [{}] }}>
        <Space style={{ display: "flex" }} size="middle" align="start">
          <Form.Item name="fournisseur_id" label="Fournisseur" style={{ flex: 1, minWidth: 240 }}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Sélectionner"
              options={fournisseurs.map((f) => ({ value: f.id, label: f.nom }))}
              dropdownRender={(menu) => (
                <QuickAddDropdown
                  menu={menu}
                  placeholder="Nouveau fournisseur"
                  loading={addFournisseur.isPending}
                  onAdd={(nom) => addFournisseur.mutate(nom)}
                />
              )}
            />
          </Form.Item>
          <Form.Item name="echeance" label="Échéance">
            <DatePicker format="DD/MM/YYYY" placeholder="Date" />
          </Form.Item>
        </Space>

        <Divider style={{ margin: "4px 0 12px" }}>Lignes</Divider>

        <Form.List name="lignes">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...rest }) => (
                <LigneAchat
                  key={key}
                  name={name}
                  rest={rest}
                  articles={articles as Article[]}
                  articleOptions={articleOptions}
                  form={form}
                  addArticle={addArticle}
                  onRemove={() => remove(name)}
                />
              ))}
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                Ajouter une ligne
              </Button>
            </>
          )}
        </Form.List>

        <Form.Item name="note" label="Note" style={{ marginTop: 12 }}>
          <Input placeholder="Référence fournisseur, remarque…" />
        </Form.Item>

        <Typography.Text type="secondary">
          Le stock sera mis à jour lors de la réception du bon d'achat.
        </Typography.Text>
      </Form>
    </Modal>
  );
}

function LigneAchat({
  name,
  rest,
  articles,
  articleOptions,
  form,
  addArticle,
  onRemove,
}: {
  name: number;
  rest: any;
  articles: Article[];
  articleOptions: { value: number; label: string }[];
  form: any;
  addArticle: any;
  onRemove: () => void;
}) {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const lignes = Form.useWatch("lignes", form) ?? [];
  const articleId = lignes[name]?.article_id;
  const article = articles.find((a) => a.id === articleId);

  const savePrix = async (field: string, val: number) => {
    if (!article || Number((article as any)[field]) === val) return;
    try {
      await modifierArticle(article.id, { [field]: val });
      qc.invalidateQueries({ queryKey: ["articles"] });
      message.success("Prix mis à jour");
    } catch (e: any) {
      message.error(e?.response?.data?.detail ?? "Erreur");
    }
  };

  return (
    <div style={{ marginBottom: 8, padding: 8, background: "#fafafa", borderRadius: 6 }}>
      <Space align="baseline" style={{ display: "flex", marginBottom: 4 }}>
        <Form.Item {...rest} name={[name, "article_id"]} rules={[{ required: true, message: "Article" }]} style={{ minWidth: 280, marginBottom: 0 }}>
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Article"
            options={articleOptions}
            dropdownRender={(menu) => (
              <QuickAddArticleDropdown
                menu={menu}
                loading={addArticle.isPending}
                onAdd={async (ref: string, des: string) => {
                  const created = await addArticle.mutateAsync({ reference: ref, designation: des });
                  const ligs = form.getFieldValue("lignes") ?? [];
                  ligs[name] = { ...ligs[name], article_id: created.id };
                  form.setFieldsValue({ lignes: ligs });
                }}
              />
            )}
          />
        </Form.Item>
        <Form.Item {...rest} name={[name, "quantite"]} rules={[{ required: true, message: "Qté" }]} style={{ marginBottom: 0 }}>
          <InputNumber min={0.001} placeholder="Qté" style={{ width: 90 }} />
        </Form.Item>
        <Form.Item {...rest} name={[name, "cout_unitaire"]} rules={[{ required: true, message: "Coût" }]} style={{ marginBottom: 0 }}>
          <InputNumber min={0} placeholder="Coût unit." style={{ width: 120 }} />
        </Form.Item>
        <MinusCircleOutlined onClick={onRemove} style={{ color: "#ff4d4f" }} />
      </Space>
      {article && (
        <Row gutter={8} style={{ marginTop: 4 }}>
          <Col>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>Détail:</Typography.Text>
            <InputNumber
              size="small"
              min={0}
              defaultValue={Number(article.prix_vente)}
              onBlur={(e) => savePrix("prix_vente", Number(e.target.value) || 0)}
              onPressEnter={(e) => savePrix("prix_vente", Number((e.target as HTMLInputElement).value) || 0)}
              style={{ width: 100, marginLeft: 4 }}
            />
          </Col>
          <Col>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>Gros:</Typography.Text>
            <InputNumber
              size="small"
              min={0}
              defaultValue={Number(article.prix_vente_gros)}
              onBlur={(e) => savePrix("prix_vente_gros", Number(e.target.value) || 0)}
              onPressEnter={(e) => savePrix("prix_vente_gros", Number((e.target as HTMLInputElement).value) || 0)}
              style={{ width: 100, marginLeft: 4 }}
            />
          </Col>
          <Col>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>Super gros:</Typography.Text>
            <InputNumber
              size="small"
              min={0}
              defaultValue={Number(article.prix_vente_super_gros)}
              onBlur={(e) => savePrix("prix_vente_super_gros", Number(e.target.value) || 0)}
              onPressEnter={(e) => savePrix("prix_vente_super_gros", Number((e.target as HTMLInputElement).value) || 0)}
              style={{ width: 100, marginLeft: 4 }}
            />
          </Col>
        </Row>
      )}
    </div>
  );
}

function QuickAddArticleDropdown({
  menu,
  loading,
  onAdd,
}: {
  menu: React.ReactElement;
  loading: boolean;
  onAdd: (reference: string, designation: string) => void;
}) {
  const [ref, setRef] = useState("");
  const [des, setDes] = useState("");

  return (
    <>
      {menu}
      <Divider style={{ margin: "6px 0" }} />
      <div style={{ padding: "0 8px 6px", display: "flex", flexDirection: "column", gap: 4 }}>
        <Input
          size="small"
          placeholder="Référence"
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
        />
        <Space.Compact style={{ width: "100%" }}>
          <Input
            size="small"
            placeholder="Désignation"
            value={des}
            onChange={(e) => setDes(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
          />
          <Button
            size="small"
            type="primary"
            icon={<PlusOutlined />}
            loading={loading}
            disabled={!ref.trim() || !des.trim()}
            onClick={() => {
              onAdd(ref.trim(), des.trim());
              setRef("");
              setDes("");
            }}
          />
        </Space.Compact>
      </div>
    </>
  );
}
