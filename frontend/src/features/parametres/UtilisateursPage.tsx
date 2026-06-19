import { useState } from "react";
import { Button, Card, Form, Input, Modal, Select, Space, Switch, Table, Tag, Typography, App, Popconfirm, Tooltip } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnsType } from "antd/es/table";
import {
  listerUtilisateurs,
  creerUtilisateur,
  modifierUtilisateur,
  resetPassword,
  supprimerUtilisateur,
  listerRoles,
  type UtilisateurOut,
} from "@/api/utilisateurs";
import { useAuthStore } from "@/store/auth";

export default function UtilisateursPage() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const currentUserId = useAuthStore((s) => s.utilisateur?.id);
  const magasins = useAuthStore((s) => s.utilisateur?.magasins ?? []);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UtilisateurOut | null>(null);
  const [resetOpen, setResetOpen] = useState<UtilisateurOut | null>(null);
  const [form] = Form.useForm();
  const [resetForm] = Form.useForm();

  const { data: utilisateurs = [], isFetching } = useQuery({ queryKey: ["utilisateurs"], queryFn: listerUtilisateurs });
  const { data: roles = [] } = useQuery({ queryKey: ["roles"], queryFn: listerRoles });

  const createMut = useMutation({
    mutationFn: creerUtilisateur,
    onSuccess: () => {
      message.success("Utilisateur créé");
      qc.invalidateQueries({ queryKey: ["utilisateurs"] });
      setFormOpen(false);
    },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? "Erreur"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...rest }: any) => modifierUtilisateur(id, rest),
    onSuccess: () => {
      message.success("Utilisateur modifié");
      qc.invalidateQueries({ queryKey: ["utilisateurs"] });
      setFormOpen(false);
      setEditing(null);
    },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? "Erreur"),
  });

  const deleteMut = useMutation({
    mutationFn: supprimerUtilisateur,
    onSuccess: () => {
      message.success("Utilisateur supprimé");
      qc.invalidateQueries({ queryKey: ["utilisateurs"] });
    },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? "Erreur"),
  });

  const resetMut = useMutation({
    mutationFn: ({ id, mot_de_passe }: { id: number; mot_de_passe: string }) => resetPassword(id, mot_de_passe),
    onSuccess: () => {
      message.success("Mot de passe réinitialisé");
      setResetOpen(null);
    },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? "Erreur"),
  });

  function openCreate() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ actif: true });
    setFormOpen(true);
  }

  function openEdit(u: UtilisateurOut) {
    setEditing(u);
    form.setFieldsValue({ nom: u.nom, email: u.email, role_id: u.role_id, magasin_id: u.magasin_id, actif: u.actif });
    setFormOpen(true);
  }

  function onFinish(values: any) {
    if (editing) {
      const { mot_de_passe, ...rest } = values;
      updateMut.mutate({ id: editing.id, ...rest });
    } else {
      createMut.mutate(values);
    }
  }

  const columns: ColumnsType<UtilisateurOut> = [
    { title: "Nom", dataIndex: "nom", key: "nom" },
    { title: "E-mail", dataIndex: "email", key: "email" },
    {
      title: "Rôle",
      dataIndex: "role_nom",
      width: 150,
      render: (v) => v ? <Tag color="blue">{v}</Tag> : <Tag>Aucun</Tag>,
    },
    {
      title: "Statut",
      dataIndex: "actif",
      width: 100,
      align: "center",
      render: (v) => v ? <Tag color="success">Actif</Tag> : <Tag color="default">Inactif</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      align: "right",
      render: (_, u) => (
        <Space>
          <Tooltip title="Modifier">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(u)} />
          </Tooltip>
          <Tooltip title="Réinitialiser le mot de passe">
            <Button size="small" icon={<KeyOutlined />} onClick={() => { resetForm.resetFields(); setResetOpen(u); }} />
          </Tooltip>
          {u.id !== currentUserId && (
            <Popconfirm title="Supprimer cet utilisateur ?" okText="Oui" cancelText="Non" onConfirm={() => deleteMut.mutate(u.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Gestion des utilisateurs
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Nouvel utilisateur
        </Button>
      </div>

      <Card variant="borderless">
        <Table
          rowKey="id"
          size="middle"
          loading={isFetching}
          columns={columns}
          dataSource={utilisateurs}
          pagination={false}
        />
      </Card>

      <Modal
        title={editing ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
        open={formOpen}
        onCancel={() => { setFormOpen(false); setEditing(null); }}
        onOk={() => form.submit()}
        confirmLoading={createMut.isPending || updateMut.isPending}
        okText="Enregistrer"
        cancelText="Annuler"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="nom" label="Nom complet" rules={[{ required: true, message: "Obligatoire" }]}>
            <Input placeholder="Mohamed Ali" />
          </Form.Item>
          <Form.Item name="email" label="E-mail" rules={[{ required: true, type: "email", message: "E-mail valide requis" }]}>
            <Input placeholder="operateur@adphone.dz" />
          </Form.Item>
          {!editing && (
            <Form.Item name="mot_de_passe" label="Mot de passe" rules={[{ required: true, min: 4, message: "4 caractères minimum" }]}>
              <Input.Password placeholder="••••••" />
            </Form.Item>
          )}
          <Form.Item name="role_id" label="Rôle">
            <Select
              allowClear
              placeholder="Sélectionner un rôle"
              options={roles.map((r) => ({ value: r.id, label: `${r.nom}${r.description ? ` — ${r.description}` : ""}` }))}
            />
          </Form.Item>
          <Form.Item name="magasin_id" label="Magasin par défaut">
            <Select
              allowClear
              placeholder="Sélectionner"
              options={magasins.map((m) => ({ value: m.id, label: m.nom }))}
            />
          </Form.Item>
          <Form.Item name="actif" label="Actif" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Réinitialiser le mot de passe — ${resetOpen?.nom}`}
        open={!!resetOpen}
        onCancel={() => setResetOpen(null)}
        onOk={() => resetForm.submit()}
        confirmLoading={resetMut.isPending}
        okText="Réinitialiser"
        cancelText="Annuler"
        destroyOnHidden
      >
        <Form form={resetForm} layout="vertical" onFinish={(v) => resetOpen && resetMut.mutate({ id: resetOpen.id, mot_de_passe: v.mot_de_passe })}>
          <Form.Item name="mot_de_passe" label="Nouveau mot de passe" rules={[{ required: true, min: 4, message: "4 caractères minimum" }]}>
            <Input.Password placeholder="••••••" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
