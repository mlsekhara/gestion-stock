import { useEffect } from "react";
import { Modal, Form, Select, Input, InputNumber, Button, DatePicker, Space, Segmented, Typography, App, Divider } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listerArticles, type Article } from "@/api/catalogue";
import { tiersApi } from "@/api/tiers";
import { creerVente, type TypeVente } from "@/api/ventes";

const TYPES = [
  { label: "Facture", value: "facture" },
  { label: "Proforma", value: "proforma" },
  { label: "Retour", value: "retour" },
];

export default function VenteForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const { message } = App.useApp();

  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => tiersApi("clients").lister() });
  const { data: articles = [] } = useQuery({ queryKey: ["articles", ""], queryFn: () => listerArticles(), enabled: open });

  useEffect(() => {
    if (open) form.resetFields();
  }, [open, form]);

  const mutation = useMutation({
    mutationFn: creerVente,
    onSuccess: () => {
      message.success("Document de vente créé");
      qc.invalidateQueries({ queryKey: ["ventes"] });
      onClose();
    },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? "Erreur"),
  });

  function onFinish(v: any) {
    mutation.mutate({
      client_id: v.client_id ?? null,
      type: (v.type ?? "facture") as TypeVente,
      note: v.note,
      echeance: v.echeance ? v.echeance.toISOString() : null,
      lignes: (v.lignes ?? []).map((l: any) => ({
        article_id: l.article_id,
        quantite: l.quantite,
        prix_unitaire: l.prix_unitaire,
      })),
    });
  }

  // Pré-remplit le prix de vente quand on choisit un article.
  function onValuesChange(changed: any) {
    if (!changed.lignes) return;
    const lignes = form.getFieldValue("lignes") ?? [];
    changed.lignes.forEach((modif: any, idx: number) => {
      if (modif && modif.article_id !== undefined) {
        const art = (articles as Article[]).find((a) => a.id === modif.article_id);
        if (art && !lignes[idx]?.prix_unitaire) {
          lignes[idx] = { ...lignes[idx], prix_unitaire: Number(art.prix_vente) };
          form.setFieldsValue({ lignes });
        }
      }
    });
  }

  const articleOptions = (articles as Article[]).map((a) => ({
    value: a.id,
    label: `${a.reference} — ${a.designation} (stock ${Number(a.quantite)})`,
  }));

  return (
    <Modal
      title="Nouveau document de vente"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      okText="Créer"
      cancelText="Annuler"
      width={780}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onFinish} onValuesChange={onValuesChange} initialValues={{ type: "facture", lignes: [{}] }}>
        <Form.Item name="type" label="Type">
          <Segmented options={TYPES} block />
        </Form.Item>

        <Space style={{ display: "flex" }} size="middle" align="start">
          <Form.Item name="client_id" label="Client" style={{ flex: 1, minWidth: 240 }}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Sélectionner"
              options={clients.map((c) => ({ value: c.id, label: c.nom }))}
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
                <Space key={key} align="baseline" style={{ display: "flex", marginBottom: 4 }}>
                  <Form.Item {...rest} name={[name, "article_id"]} rules={[{ required: true, message: "Article" }]} style={{ minWidth: 320 }}>
                    <Select showSearch optionFilterProp="label" placeholder="Article" options={articleOptions} />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, "quantite"]} rules={[{ required: true, message: "Qté" }]}>
                    <InputNumber min={0.001} placeholder="Qté" style={{ width: 90 }} />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, "prix_unitaire"]} rules={[{ required: true, message: "Prix" }]}>
                    <InputNumber min={0} placeholder="Prix unit." style={{ width: 120 }} />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} style={{ color: "#ff4d4f" }} />
                </Space>
              ))}
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                Ajouter une ligne
              </Button>
            </>
          )}
        </Form.List>

        <Form.Item name="note" label="Note" style={{ marginTop: 12 }}>
          <Input placeholder="Remarque…" />
        </Form.Item>

        <Typography.Text type="secondary">
          Le stock est mis à jour à la validation (facture : sortie, retour : entrée ; proforma : aucun mouvement).
        </Typography.Text>
      </Form>
    </Modal>
  );
}
