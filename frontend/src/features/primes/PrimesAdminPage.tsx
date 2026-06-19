import { useState } from "react";
import { Button, Card, Form, InputNumber, Modal, Select, Space, Table, Typography, App, Popconfirm, Tag, Statistic, Row, Col } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined, TrophyOutlined, ReloadOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnsType } from "antd/es/table";
import {
  listerConfigs,
  creerConfig,
  modifierConfig,
  supprimerConfig,
  bilanAdmin,
  listerUtilisateurs,
  type PrimeConfig,
  type PrimeBilanAdmin,
} from "@/api/primes";

const PERIODICITES = [
  { value: "hebdomadaire", label: "Hebdomadaire" },
  { value: "mensuelle", label: "Mensuelle" },
  { value: "trimestrielle", label: "Trimestrielle" },
];

export default function PrimesAdminPage() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PrimeConfig | null>(null);
  const [form] = Form.useForm();

  const { data: configs = [] } = useQuery({ queryKey: ["prime-configs"], queryFn: listerConfigs });
  const { data: bilan = [], isFetching: bilanLoading } = useQuery({ queryKey: ["prime-bilan"], queryFn: bilanAdmin });
  const { data: utilisateurs = [] } = useQuery({ queryKey: ["prime-utilisateurs"], queryFn: listerUtilisateurs });

  const configuredUserIds = configs.map((c) => c.utilisateur_id);
  const availableUsers = utilisateurs.filter((u) => !configuredUserIds.includes(u.id) || u.id === editing?.utilisateur_id);

  const createMut = useMutation({
    mutationFn: creerConfig,
    onSuccess: () => {
      message.success("Configuration créée");
      qc.invalidateQueries({ queryKey: ["prime-configs"] });
      qc.invalidateQueries({ queryKey: ["prime-bilan"] });
      setFormOpen(false);
    },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? "Erreur"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...rest }: any) => modifierConfig(id, rest),
    onSuccess: () => {
      message.success("Configuration modifiée");
      qc.invalidateQueries({ queryKey: ["prime-configs"] });
      qc.invalidateQueries({ queryKey: ["prime-bilan"] });
      setFormOpen(false);
      setEditing(null);
    },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? "Erreur"),
  });

  const deleteMut = useMutation({
    mutationFn: supprimerConfig,
    onSuccess: () => {
      message.success("Configuration supprimée");
      qc.invalidateQueries({ queryKey: ["prime-configs"] });
      qc.invalidateQueries({ queryKey: ["prime-bilan"] });
    },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? "Erreur"),
  });

  function openCreate() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ taux_ca: 0, taux_recouvrement: 0, periodicite: "mensuelle" });
    setFormOpen(true);
  }

  function openEdit(config: PrimeConfig) {
    setEditing(config);
    form.setFieldsValue({
      utilisateur_id: config.utilisateur_id,
      taux_ca: Number(config.taux_ca),
      taux_recouvrement: Number(config.taux_recouvrement),
      periodicite: config.periodicite,
    });
    setFormOpen(true);
  }

  function onFinish(values: any) {
    if (editing) {
      updateMut.mutate({ id: editing.id, ...values });
    } else {
      createMut.mutate(values);
    }
  }

  const configColumns: ColumnsType<PrimeConfig> = [
    { title: "Opérateur", dataIndex: "utilisateur_nom", key: "nom" },
    {
      title: "Taux CA (%)",
      dataIndex: "taux_ca",
      width: 110,
      align: "center",
      render: (v) => <Tag color="blue">{Number(v)}%</Tag>,
    },
    {
      title: "Taux Recouvrement (%)",
      dataIndex: "taux_recouvrement",
      width: 160,
      align: "center",
      render: (v) => <Tag color="green">{Number(v)}%</Tag>,
    },
    {
      title: "Période",
      dataIndex: "periodicite",
      width: 130,
      render: (v) => PERIODICITES.find((p) => p.value === v)?.label ?? v,
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      align: "right",
      render: (_, c) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(c)} />
          <Popconfirm title="Supprimer cette configuration ?" okText="Oui" cancelText="Non" onConfirm={() => deleteMut.mutate(c.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const bilanColumns: ColumnsType<PrimeBilanAdmin> = [
    { title: "Opérateur", dataIndex: "utilisateur_nom", key: "nom" },
    { title: "Période", key: "periode", width: 180, render: (_, r) => `${r.date_debut} → ${r.date_fin}` },
    {
      title: "CA réalisé",
      dataIndex: "ca_realise",
      width: 120,
      align: "right",
      render: (v) => Number(v).toLocaleString("fr-FR"),
    },
    {
      title: "Recouvrement",
      dataIndex: "recouvrement_realise",
      width: 130,
      align: "right",
      render: (v) => Number(v).toLocaleString("fr-FR"),
    },
    {
      title: "Prime CA",
      dataIndex: "prime_ca",
      width: 100,
      align: "right",
      render: (v) => <Typography.Text type="success">{Number(v).toLocaleString("fr-FR")}</Typography.Text>,
    },
    {
      title: "Prime Recouv.",
      dataIndex: "prime_recouvrement",
      width: 110,
      align: "right",
      render: (v) => <Typography.Text type="success">{Number(v).toLocaleString("fr-FR")}</Typography.Text>,
    },
    {
      title: "Prime totale",
      dataIndex: "prime_totale",
      width: 120,
      align: "right",
      render: (v) => <Tag color="gold" style={{ fontSize: 14 }}>{Number(v).toLocaleString("fr-FR")}</Tag>,
    },
  ];

  const totalPrimes = bilan.reduce((s, b) => s + Number(b.prime_totale), 0);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          <TrophyOutlined style={{ marginRight: 8 }} />
          Système de primes
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Configurer un opérateur
        </Button>
      </div>

      <Card title="Configuration des taux" variant="borderless">
        <Table rowKey="id" size="middle" columns={configColumns} dataSource={configs} pagination={false} />
      </Card>

      <Card
        title="Bilan des primes (période en cours)"
        variant="borderless"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => qc.invalidateQueries({ queryKey: ["prime-bilan"] })}>
            Actualiser
          </Button>
        }
      >
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col>
            <Statistic title="Total primes à verser" value={totalPrimes} precision={2} suffix="DA" valueStyle={{ color: "#faad14" }} />
          </Col>
          <Col>
            <Statistic title="Opérateurs configurés" value={bilan.length} />
          </Col>
        </Row>
        <Table rowKey="utilisateur_id" size="middle" loading={bilanLoading} columns={bilanColumns} dataSource={bilan} pagination={false} />
      </Card>

      <Modal
        title={editing ? "Modifier la configuration" : "Configurer un opérateur"}
        open={formOpen}
        onCancel={() => { setFormOpen(false); setEditing(null); }}
        onOk={() => form.submit()}
        confirmLoading={createMut.isPending || updateMut.isPending}
        okText="Enregistrer"
        cancelText="Annuler"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="utilisateur_id" label="Opérateur" rules={[{ required: true, message: "Choisissez un opérateur" }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Sélectionner"
              disabled={!!editing}
              options={availableUsers.map((u) => ({ value: u.id, label: `${u.nom} (${u.email})` }))}
            />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="taux_ca" label="Taux sur CA (%)" rules={[{ required: true }]}>
                <InputNumber min={0} max={100} step={0.5} style={{ width: "100%" }} addonAfter="%" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="taux_recouvrement" label="Taux sur recouvrement (%)" rules={[{ required: true }]}>
                <InputNumber min={0} max={100} step={0.5} style={{ width: "100%" }} addonAfter="%" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="periodicite" label="Périodicité" rules={[{ required: true }]}>
            <Select options={PERIODICITES} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
