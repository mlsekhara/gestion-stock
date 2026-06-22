import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button, Card, DatePicker, Space, Table, Tag, Typography } from "antd";
import { PrinterOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { getReleveFournisseur, type ReleveEntry } from "@/api/releve";
import { imprimerReleve } from "@/utils/imprimerReleve";
import { useAuthStore } from "@/store/auth";

const { RangePicker } = DatePicker;
const fmt = (v: number) => Number(v).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ReleveFournisseurPage() {
  const { fournisseurId } = useParams<{ fournisseurId: string }>();
  const id = Number(fournisseurId);
  const devise = useAuthStore((s) => s.utilisateur?.entreprise.devise ?? "DA");
  const entreprise = useAuthStore((s) => s.utilisateur?.entreprise);
  const [dates, setDates] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

  const dateDebut = dates[0]?.format("YYYY-MM-DD");
  const dateFin = dates[1]?.format("YYYY-MM-DD");

  const { data, isFetching } = useQuery({
    queryKey: ["releve-fournisseur", id, dateDebut, dateFin],
    queryFn: () => getReleveFournisseur(id, dateDebut, dateFin),
    enabled: !!id,
  });

  const colonnes: ColumnsType<ReleveEntry> = [
    { title: "Date", dataIndex: "date", width: 100, align: "center" },
    {
      title: "Désignation",
      dataIndex: "designation",
      render: (v, r) => (
        <Space>
          {v}
          {r.type === "paiement" && <Tag color="green">Paiement</Tag>}
        </Space>
      ),
    },
    { title: "Réf.", dataIndex: "reference", width: 100, align: "center" },
    {
      title: "Qté",
      dataIndex: "quantite",
      width: 60,
      align: "center",
      render: (v) => (v != null ? Number(v).toLocaleString("fr-FR") : "—"),
    },
    {
      title: `P.U (${devise})`,
      dataIndex: "prix_unitaire",
      width: 100,
      align: "right",
      render: (v) => (v != null ? fmt(v) : "—"),
    },
    {
      title: `Débit (${devise})`,
      dataIndex: "debit",
      width: 110,
      align: "right",
      render: (v: number) => (v > 0 ? <span style={{ color: "#d32f2f" }}>{fmt(v)}</span> : ""),
    },
    {
      title: `Crédit (${devise})`,
      dataIndex: "credit",
      width: 110,
      align: "right",
      render: (v: number) => (v > 0 ? <span style={{ color: "#2e7d32", fontWeight: 600 }}>{fmt(v)}</span> : ""),
    },
    {
      title: `Solde (${devise})`,
      dataIndex: "solde",
      width: 120,
      align: "right",
      render: (v: number) => (
        <span style={{ fontWeight: 700, color: v > 0 ? "#d32f2f" : "#2e7d32" }}>{fmt(v)}</span>
      ),
    },
  ];

  const handlePrint = () => {
    if (!data || !entreprise) return;
    const adapted = {
      ...data,
      client: data.fournisseur,
    };
    imprimerReleve(
      adapted,
      { nom: entreprise.nom, adresse: entreprise.adresse ?? undefined, telephone: entreprise.telephone ?? undefined },
      devise,
    );
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <Space>
          <Link to="/tiers/fournisseurs">
            <Button icon={<ArrowLeftOutlined />}>Fournisseurs</Button>
          </Link>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Relevé de compte {data?.fournisseur.nom ? `— ${data.fournisseur.nom}` : ""}
          </Typography.Title>
        </Space>
        <Space>
          <RangePicker
            format="DD/MM/YYYY"
            placeholder={["Date début", "Date fin"]}
            value={dates}
            onChange={(vals) => setDates(vals ? [vals[0], vals[1]] : [null, null])}
            allowClear
          />
          <Button icon={<PrinterOutlined />} onClick={handlePrint} disabled={!data?.entries.length}>
            Imprimer
          </Button>
        </Space>
      </div>

      {data && (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Card size="small" style={{ minWidth: 180 }}>
            <Typography.Text type="secondary">Total achats</Typography.Text>
            <Typography.Title level={4} style={{ margin: 0, color: "#d32f2f" }}>
              {fmt(data.total_debit)} {devise}
            </Typography.Title>
          </Card>
          <Card size="small" style={{ minWidth: 180 }}>
            <Typography.Text type="secondary">Total paiements</Typography.Text>
            <Typography.Title level={4} style={{ margin: 0, color: "#2e7d32" }}>
              {fmt(data.total_credit)} {devise}
            </Typography.Title>
          </Card>
          <Card size="small" style={{ minWidth: 180 }}>
            <Typography.Text type="secondary">Solde restant</Typography.Text>
            <Typography.Title level={4} style={{ margin: 0, color: data.solde_final > 0 ? "#d32f2f" : "#2e7d32" }}>
              {fmt(data.solde_final)} {devise}
            </Typography.Title>
          </Card>
        </div>
      )}

      <Card variant="borderless">
        <Table
          rowKey={(_, i) => String(i)}
          loading={isFetching}
          columns={colonnes}
          dataSource={data?.entries ?? []}
          pagination={false}
          scroll={{ x: 900 }}
          rowClassName={(r) => (r.type === "paiement" ? "paiement-row" : "")}
          summary={() =>
            data && data.entries.length > 0 ? (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5} align="right">
                    <strong>Totaux</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right">
                    <strong style={{ color: "#d32f2f" }}>{fmt(data.total_debit)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6} align="right">
                    <strong style={{ color: "#2e7d32" }}>{fmt(data.total_credit)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={7} align="right">
                    <strong style={{ color: data.solde_final > 0 ? "#d32f2f" : "#2e7d32" }}>
                      {fmt(data.solde_final)}
                    </strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            ) : undefined
          }
        />
      </Card>

      <style>{`.paiement-row { background: #e8f5e9 !important; }`}</style>
    </Space>
  );
}
