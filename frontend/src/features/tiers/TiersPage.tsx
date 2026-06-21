import { useEffect, useState } from "react";
import { Button, Card, Form, Input, Modal, Space, Switch, Table, Tag, Typography, Popconfirm, App } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnsType } from "antd/es/table";
import { tiersApi, type Tiers, type TiersRessource } from "@/api/tiers";
import { useAuthStore } from "@/store/auth";

const fmt = (v: number) => Number(v).toLocaleString("fr-FR");

export default function TiersPage({ ressource, titre }: { ressource: TiersRessource; titre: string }) {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [edite, setEdite] = useState<Tiers | null>(null);
  const apiRes = tiersApi(ressource);
  const devise = useAuthStore((s) => s.utilisateur?.entreprise.devise ?? "DA");

  const { data = [], isFetching } = useQuery({ queryKey: [ressource], queryFn: () => apiRes.lister() });

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (edite) form.setFieldsValue(edite);
    }
  }, [open, edite, form]);

  const mutation = useMutation({
    mutationFn: (values: Partial<Tiers>) => (edite ? apiRes.modifier(edite.id, values) : apiRes.creer(values)),
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

  const isClient = ressource === "clients";

  const colonnes: ColumnsType<Tiers> = [
    { title: "Nom", dataIndex: "nom" },
    { title: "Téléphone", dataIndex: "telephone", render: (v) => v ?? "—" },
    { title: "Adresse", dataIndex: "adresse", render: (v) => v ?? "—", responsive: ["md"] },
    {
      title: isClient ? `CA (${devise})` : `Achats (${devise})`,
      key: "total",
      width: 130,
      align: "right",
      render: (_, r) => fmt(isClient ? (r.total_achats_client ?? 0) : (r.total_achats_fournisseur ?? 0)),
    },
    {
      title: `Crédit (${devise})`,
      key: "credit",
      width: 130,
      align: "right",
      render: (_, r) => {
        const val = r.reste_a_payer ?? 0;
        return <span style={{ color: val > 0 ? "#ff4d4f" : "#52c41a", fontWeight: val > 0 ? 600 : 400 }}>{fmt(val)}</span>;
      },
    },
    { title: "Actif", dataIndex: "actif", width: 80, align: "center", render: (v) => (v ? <Tag color="success">Oui</Tag> : <Tag>Non</Tag>) },
    {
      title: "Actions",
      key: "actions",
      width: 110,
      align: "right",
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => { setEdite(r); setOpen(true); }} />
          <Popconfirm title="Supprimer ?" okText="Oui" cancelText="Non" onConfirm={() => suppression.mutate(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const totalCredit = data.reduce((sum, t) => sum + (t.reste_a_payer ?? 0), 0);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>{titre}</Typography.Title>
          {totalCredit > 0 && (
            <Typography.Text type="danger" strong>
              Total crédit : {fmt(totalCredit)} {devise}
            </Typography.Text>
          )}
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEdite(null); setOpen(true); }}>
          Ajouter
        </Button>
      </div>

      <Card variant="borderless">
        <Table rowKey="id" loading={isFetching} columns={colonnes} dataSource={data} pagination={{ pageSize: 12 }} scroll={{ x: 800 }} />
      </Card>

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
        <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate(v)} initialValues={{ actif: true }}>
          <Form.Item name="nom" label="Nom" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Space style={{ display: "flex" }} size="middle">
            <Form.Item name="telephone" label="Téléphone" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="email" label="E-mail" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>
          <Form.Item name="adresse" label="Adresse">
            <Input />
          </Form.Item>
          <Space style={{ display: "flex" }} size="middle">
            <Form.Item name="rc" label="RC (Registre Commerce)" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="nif" label="NIF" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>
          <Form.Item name="actif" label="Actif" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
