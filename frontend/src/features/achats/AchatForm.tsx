import { useEffect } from "react";
import { Modal, Form, Select, Input, InputNumber, Button, DatePicker, Space, Typography, App, Divider } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listerArticles, type Article } from "@/api/catalogue";
import { tiersApi } from "@/api/tiers";
import { creerAchat } from "@/api/achats";

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
                  <Form.Item {...rest} name={[name, "article_id"]} rules={[{ required: true, message: "Article" }]} style={{ minWidth: 280 }}>
                    <Select showSearch optionFilterProp="label" placeholder="Article" options={articleOptions} />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, "quantite"]} rules={[{ required: true, message: "Qté" }]}>
                    <InputNumber min={0.001} placeholder="Qté" style={{ width: 90 }} />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, "cout_unitaire"]} rules={[{ required: true, message: "Coût" }]}>
                    <InputNumber min={0} placeholder="Coût unit." style={{ width: 120 }} />
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
          <Input placeholder="Référence fournisseur, remarque…" />
        </Form.Item>

        <Typography.Text type="secondary">
          Le stock sera mis à jour lors de la réception du bon d'achat.
        </Typography.Text>
      </Form>
    </Modal>
  );
}
