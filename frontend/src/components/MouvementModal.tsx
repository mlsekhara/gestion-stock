import { useEffect, useState } from "react";
import { Modal, Form, Select, InputNumber, Input, Segmented, Button, App, Space, Tag } from "antd";
import { BarcodeOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listerArticles, articleParCodeBarres, type Article } from "@/api/catalogue";
import { creerMouvement, type TypeMouvement } from "@/api/stock";
import { useAuthStore } from "@/store/auth";
import CameraScanner from "@/components/CameraScanner";

interface Props {
  open: boolean;
  onClose: () => void;
  article?: Article | null; // pré-sélection éventuelle
}

const TYPES: { label: string; value: TypeMouvement }[] = [
  { label: "Entrée", value: "entree" },
  { label: "Sortie", value: "sortie" },
  { label: "Ajustement", value: "ajustement" },
  { label: "Transfert", value: "transfert" },
];

export default function MouvementModal({ open, onClose, article }: Props) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [scan, setScan] = useState(false);
  const [type, setType] = useState<TypeMouvement>("entree");
  const { utilisateur, magasinCourantId } = useAuthStore();

  const { data: articles = [] } = useQuery({
    queryKey: ["articles", ""],
    queryFn: () => listerArticles(),
    enabled: open && !article,
  });

  useEffect(() => {
    if (open) {
      form.resetFields();
      setType("entree");
      if (article) form.setFieldValue("article_id", article.id);
    }
  }, [open, article, form]);

  const mutation = useMutation({
    mutationFn: creerMouvement,
    onSuccess: () => {
      message.success("Mouvement enregistré");
      qc.invalidateQueries({ queryKey: ["articles"] });
      qc.invalidateQueries({ queryKey: ["kpis-stock"] });
      qc.invalidateQueries({ queryKey: ["mouvements"] });
      onClose();
    },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? "Erreur"),
  });

  const autresMagasins = (utilisateur?.magasins ?? []).filter((m) => m.id !== magasinCourantId);

  async function onScan(code: string) {
    try {
      const a = await articleParCodeBarres(code);
      form.setFieldValue("article_id", a.id);
      message.success(`Article : ${a.designation}`);
    } catch {
      message.warning(`Aucun article pour le code ${code}`);
    }
  }

  return (
    <Modal
      title="Nouveau mouvement de stock"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      okText="Valider"
      cancelText="Annuler"
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate({ ...v, type })}>
        <Form.Item label="Type de mouvement">
          <Segmented options={TYPES} value={type} onChange={(v) => setType(v as TypeMouvement)} block />
        </Form.Item>

        {article ? (
          <Form.Item label="Article">
            <Space>
              <Tag color="blue">{article.reference}</Tag>
              {article.designation}
            </Space>
            <Form.Item name="article_id" initialValue={article.id} hidden>
              <Input />
            </Form.Item>
          </Form.Item>
        ) : (
          <Form.Item label="Article" required>
            <Space.Compact style={{ width: "100%" }}>
              <Form.Item name="article_id" noStyle rules={[{ required: true, message: "Sélectionnez un article" }]}>
                <Select
                  showSearch
                  placeholder="Rechercher un article"
                  optionFilterProp="label"
                  options={(articles as Article[]).map((a) => ({ value: a.id, label: `${a.reference} — ${a.designation}` }))}
                  style={{ width: "100%" }}
                />
              </Form.Item>
              <Button icon={<BarcodeOutlined />} onClick={() => setScan(true)} />
            </Space.Compact>
          </Form.Item>
        )}

        <Form.Item
          name="quantite"
          label={type === "ajustement" ? "Quantité (delta signé : +/−)" : "Quantité"}
          rules={[{ required: true }]}
        >
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>

        {type === "entree" && (
          <Form.Item name="cout_unitaire" label="Coût unitaire (met à jour le prix moyen)">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        )}

        {type === "transfert" && (
          <Form.Item name="magasin_destination_id" label="Magasin de destination" rules={[{ required: true }]}>
            <Select options={autresMagasins.map((m) => ({ value: m.id, label: m.nom }))} placeholder="Choisir" />
          </Form.Item>
        )}

        <Form.Item name="motif" label="Motif / note">
          <Input placeholder="Ex. réception fournisseur, casse, correction…" />
        </Form.Item>
      </Form>

      <CameraScanner open={scan} onClose={() => setScan(false)} onResult={onScan} />
    </Modal>
  );
}
