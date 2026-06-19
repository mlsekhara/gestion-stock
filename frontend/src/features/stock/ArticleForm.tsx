import { useEffect, useState } from "react";
import { Modal, Form, Input, InputNumber, Select, Switch, Row, Col, Button, App, Space } from "antd";
import { BarcodeOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  creerArticle,
  modifierArticle,
  refApi,
  type Article,
  type Ref,
  type Taxe,
  type Unite,
} from "@/api/catalogue";
import CameraScanner from "@/components/CameraScanner";

interface Props {
  open: boolean;
  article: Article | null;
  onClose: () => void;
}

export default function ArticleForm({ open, article, onClose }: Props) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [scan, setScan] = useState(false);

  const { data: familles = [] } = useQuery({ queryKey: ["familles"], queryFn: refApi("familles").lister });
  const { data: marques = [] } = useQuery({ queryKey: ["marques"], queryFn: refApi("marques").lister });
  const { data: unites = [] } = useQuery({ queryKey: ["unites"], queryFn: refApi("unites").lister });
  const { data: taxes = [] } = useQuery({ queryKey: ["taxes"], queryFn: refApi("taxes").lister });

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (article) form.setFieldsValue(article);
    }
  }, [open, article, form]);

  const mutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      article ? modifierArticle(article.id, values) : creerArticle(values),
    onSuccess: () => {
      message.success(article ? "Article modifié" : "Article créé");
      qc.invalidateQueries({ queryKey: ["articles"] });
      qc.invalidateQueries({ queryKey: ["kpis-stock"] });
      onClose();
    },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? "Erreur"),
  });

  const opt = (items: Ref[]) => items.map((i) => ({ value: i.id, label: i.nom }));

  return (
    <Modal
      title={article ? "Modifier l'article" : "Nouvel article"}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      okText="Enregistrer"
      cancelText="Annuler"
      width={680}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(v) => mutation.mutate(v)}
        initialValues={{ prix_vente: 0, prix_vente_gros: 0, prix_vente_super_gros: 0, prix_achat_moyen: 0, seuil_alerte: 0, suivi_serie: false, actif: true }}
      >
        <Row gutter={12}>
          <Col xs={24} sm={8}>
            <Form.Item name="reference" label="Référence" rules={[{ required: true }]}>
              <Input placeholder="ECR-IP11" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={16}>
            <Form.Item name="designation" label="Désignation" rules={[{ required: true }]}>
              <Input placeholder="Écran iPhone 11" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Code-barres">
          <Space.Compact style={{ width: "100%" }}>
            <Form.Item name="code_barres" noStyle>
              <Input placeholder="Scanner ou saisir" />
            </Form.Item>
            <Button icon={<BarcodeOutlined />} onClick={() => setScan(true)}>
              Scanner
            </Button>
          </Space.Compact>
        </Form.Item>

        <Row gutter={12}>
          <Col xs={12} sm={6}>
            <Form.Item name="famille_id" label="Famille">
              <Select allowClear options={opt(familles)} placeholder="—" />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item name="marque_id" label="Marque">
              <Select allowClear options={opt(marques)} placeholder="—" />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item name="unite_id" label="Unité">
              <Select allowClear options={(unites as Unite[]).map((uu) => ({ value: uu.id, label: uu.nom }))} placeholder="—" />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item name="taxe_id" label="Taxe">
              <Select allowClear options={(taxes as Taxe[]).map((tt) => ({ value: tt.id, label: `${tt.nom}` }))} placeholder="—" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col xs={12} sm={6}>
            <Form.Item name="prix_achat_moyen" label="Prix d'achat moy.">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item name="prix_vente" label="Prix vente (détail)">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item name="prix_vente_gros" label="Prix vente (gros)">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item name="prix_vente_super_gros" label="Prix (super gros)">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col xs={12} sm={8}>
            <Form.Item name="seuil_alerte" label="Seuil d'alerte">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col xs={12} sm={8}>
            <Form.Item name="suivi_serie" label="Suivi IMEI / série" valuePropName="checked" tooltip="Pour la téléphonie">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8}>
            <Form.Item name="actif" label="Actif" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <CameraScanner open={scan} onClose={() => setScan(false)} onResult={(code) => form.setFieldValue("code_barres", code)} />
    </Modal>
  );
}
