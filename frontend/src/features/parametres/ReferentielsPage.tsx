import { useEffect, useState } from "react";
import { Button, Card, Form, Input, InputNumber, Modal, Space, Table, Tabs, App, Popconfirm } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnsType } from "antd/es/table";
import { Link } from "react-router-dom";
import { BgColorsOutlined } from "@ant-design/icons";
import { refApi } from "@/api/catalogue";

type Ressource = "familles" | "marques" | "unites" | "taxes";
type Champ = { name: string; label: string; type?: "text" | "number"; required?: boolean };

interface Ligne {
  id: number;
  nom: string;
  [k: string]: unknown;
}

function RefTable({ ressource, champs }: { ressource: Ressource; champs: Champ[] }) {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [edite, setEdite] = useState<Ligne | null>(null);
  const apiRes = refApi(ressource);

  const { data = [], isFetching } = useQuery({ queryKey: [ressource], queryFn: apiRes.lister });

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (edite) form.setFieldsValue(edite);
    }
  }, [open, edite, form]);

  const mutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      edite ? apiRes.modifier(edite.id, values) : apiRes.creer(values),
    onSuccess: () => {
      message.success(edite ? "Modifié" : "Créé");
      qc.invalidateQueries({ queryKey: [ressource] });
      setOpen(false);
    },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? "Erreur"),
  });

  const suppression = useMutation({
    mutationFn: apiRes.supprimer,
    onSuccess: () => {
      message.success("Supprimé");
      qc.invalidateQueries({ queryKey: [ressource] });
    },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? "Suppression impossible"),
  });

  const colonnes: ColumnsType<Ligne> = [
    ...champs.map((c) => ({ title: c.label, dataIndex: c.name })),
    {
      title: "Actions",
      key: "actions",
      width: 110,
      align: "right" as const,
      render: (_: unknown, r: Ligne) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => { setEdite(r); setOpen(true); }} />
          <Popconfirm title="Supprimer ?" okText="Oui" cancelText="Non" onConfirm={() => suppression.mutate(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEdite(null); setOpen(true); }}>
          Ajouter
        </Button>
      </Space>
      <Table rowKey="id" size="middle" loading={isFetching} columns={colonnes} dataSource={data as Ligne[]} pagination={{ pageSize: 8 }} />

      <Modal
        title={edite ? "Modifier" : "Ajouter"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={mutation.isPending}
        okText="Enregistrer"
        cancelText="Annuler"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate(v)}>
          {champs.map((c) => (
            <Form.Item key={c.name} name={c.name} label={c.label} rules={c.required ? [{ required: true }] : []}>
              {c.type === "number" ? <InputNumber min={0} style={{ width: "100%" }} /> : <Input />}
            </Form.Item>
          ))}
        </Form>
      </Modal>
    </>
  );
}

export default function ReferentielsPage() {
  return (
    <Card variant="borderless" title="Référentiels du catalogue" extra={<Link to="/marque"><Button icon={<BgColorsOutlined />}>Charte de marque</Button></Link>}>
      <Tabs
        items={[
          { key: "familles", label: "Familles", children: <RefTable ressource="familles" champs={[{ name: "nom", label: "Nom", required: true }, { name: "description", label: "Description" }]} /> },
          { key: "marques", label: "Marques", children: <RefTable ressource="marques" champs={[{ name: "nom", label: "Nom", required: true }]} /> },
          { key: "unites", label: "Unités", children: <RefTable ressource="unites" champs={[{ name: "nom", label: "Nom", required: true }, { name: "abreviation", label: "Abréviation" }]} /> },
          { key: "taxes", label: "Taxes (TVA)", children: <RefTable ressource="taxes" champs={[{ name: "nom", label: "Nom", required: true }, { name: "taux", label: "Taux (%)", type: "number", required: true }]} /> },
        ]}
      />
    </Card>
  );
}
