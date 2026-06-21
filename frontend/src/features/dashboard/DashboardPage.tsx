import { useState } from "react";
import { Card, Col, Row, Statistic, Select, Typography, Space, App } from "antd";
import {
  DropboxOutlined,
  WarningOutlined,
  ShoppingOutlined,
  DollarOutlined,
  RiseOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  LineChartOutlined,
  FallOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import ReactEChartsCore from "echarts-for-react";
import { useAuthStore } from "@/store/auth";
import CameraScanner from "@/components/CameraScanner";
import {
  kpisDashboard,
  ventesParJour,
  topArticles,
  stockParFamille,
} from "@/api/dashboard";

const fmt = (v: number) => Number(v).toLocaleString("fr-FR");

const PERIODES = [
  { value: "", label: "Tout" },
  { value: "today", label: "Aujourd'hui" },
  { value: "week", label: "Cette semaine" },
  { value: "month", label: "Ce mois" },
  { value: "quarter", label: "Ce trimestre" },
  { value: "year", label: "Cette année" },
];

export default function DashboardPage() {
  const { utilisateur } = useAuthStore();
  const { message } = App.useApp();
  const devise = utilisateur?.entreprise.devise ?? "DA";
  const [periode, setPeriode] = useState("month");
  const [scanOuvert, setScanOuvert] = useState(false);

  const { data: kpis } = useQuery({
    queryKey: ["dashboard-kpis", periode],
    queryFn: () => kpisDashboard(periode || undefined),
  });

  const { data: ventesTrend = [] } = useQuery({
    queryKey: ["dashboard-ventes-jour"],
    queryFn: () => ventesParJour(30),
  });

  const { data: top = [] } = useQuery({
    queryKey: ["dashboard-top-articles", periode],
    queryFn: () => topArticles(10, periode || undefined),
  });

  const { data: familles = [] } = useQuery({
    queryKey: ["dashboard-stock-famille"],
    queryFn: () => stockParFamille(),
  });

  const kpiCards = [
    { titre: "Articles disponibles", valeur: kpis?.disponible ?? 0, icone: <DropboxOutlined />, couleur: "#52c41a" },
    { titre: "En rupture", valeur: kpis?.rupture ?? 0, icone: <WarningOutlined />, couleur: "#ff4d4f" },
    { titre: "En alerte", valeur: kpis?.alerte ?? 0, icone: <FallOutlined />, couleur: "#faad14" },
    { titre: `Valeur stock (${devise})`, valeur: kpis?.valeur_stock ?? 0, icone: <DollarOutlined />, couleur: "#722ed1" },
    { titre: "Ventes", valeur: kpis?.nb_ventes ?? 0, icone: <ShoppingOutlined />, couleur: "#1677ff" },
    { titre: `CA (${devise})`, valeur: kpis?.chiffre_affaires ?? 0, icone: <RiseOutlined />, couleur: "#52c41a" },
    { titre: `Marge (${devise})`, valeur: kpis?.marge ?? 0, icone: <LineChartOutlined />, couleur: "#13c2c2" },
    { titre: `Panier moyen (${devise})`, valeur: kpis?.panier_moyen ?? 0, icone: <ShoppingCartOutlined />, couleur: "#fa8c16" },
    { titre: `Achats (${devise})`, valeur: kpis?.total_achats ?? 0, icone: <ShoppingCartOutlined />, couleur: "#eb2f96" },
    { titre: `Créances (${devise})`, valeur: kpis?.total_creances ?? 0, icone: <DollarOutlined />, couleur: "#ff4d4f" },
    { titre: "Clients", valeur: kpis?.nb_clients ?? 0, icone: <TeamOutlined />, couleur: "#1677ff" },
    { titre: "Fournisseurs", valeur: kpis?.nb_fournisseurs ?? 0, icone: <TeamOutlined />, couleur: "#faad14" },
  ];

  const trendOption = {
    tooltip: { trigger: "axis" as const },
    grid: { left: 60, right: 20, top: 30, bottom: 30 },
    xAxis: { type: "category" as const, data: ventesTrend.map((v) => v.jour), axisLabel: { fontSize: 10, rotate: 45 } },
    yAxis: { type: "value" as const, axisLabel: { formatter: (v: number) => fmt(v) } },
    series: [
      {
        name: `CA (${devise})`,
        type: "bar",
        data: ventesTrend.map((v) => v.ca),
        itemStyle: { color: "#1677ff", borderRadius: [4, 4, 0, 0] },
      },
      {
        name: "Nb ventes",
        type: "line",
        yAxisIndex: 0,
        data: ventesTrend.map((v) => v.nb),
        smooth: true,
        lineStyle: { color: "#52c41a", width: 2 },
        itemStyle: { color: "#52c41a" },
      },
    ],
  };

  const topOption = {
    tooltip: { trigger: "axis" as const },
    grid: { left: 140, right: 30, top: 10, bottom: 10 },
    xAxis: { type: "value" as const, axisLabel: { formatter: (v: number) => fmt(v) } },
    yAxis: {
      type: "category" as const,
      data: [...top].reverse().map((a) => a.designation.length > 20 ? a.designation.slice(0, 20) + "…" : a.designation),
      axisLabel: { fontSize: 11 },
    },
    series: [
      {
        type: "bar",
        data: [...top].reverse().map((a) => a.ca),
        itemStyle: {
          color: (p: any) => {
            const colors = ["#1677ff", "#52c41a", "#722ed1", "#fa8c16", "#13c2c2", "#eb2f96", "#faad14", "#2f54eb", "#f5222d", "#a0d911"];
            return colors[p.dataIndex % colors.length];
          },
          borderRadius: [0, 4, 4, 0],
        },
      },
    ],
  };

  const familleOption = {
    tooltip: { trigger: "item" as const, formatter: (p: any) => `${p.name}<br/>Valeur: ${fmt(p.value)} ${devise}<br/>${p.data.nb_articles} articles` },
    series: [
      {
        type: "treemap",
        data: familles.map((f) => ({ name: f.famille, value: f.valeur, nb_articles: f.nb_articles })),
        label: { show: true, formatter: "{b}\n{c}", fontSize: 12 },
        breadcrumb: { show: false },
        itemStyle: { borderColor: "#fff", borderWidth: 2 },
        levels: [
          {
            colorSaturation: [0.35, 0.5],
            itemStyle: { borderColorSaturation: 0.6, gapWidth: 1 },
          },
        ],
      },
    ],
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>Tableau de bord</Typography.Title>
          <Typography.Text type="secondary">
            {utilisateur?.entreprise.nom} · {utilisateur?.role}
          </Typography.Text>
        </div>
        <Space>
          <Select
            value={periode}
            onChange={setPeriode}
            options={PERIODES}
            style={{ width: 160 }}
          />
        </Space>
      </div>

      <Row gutter={[12, 12]}>
        {kpiCards.map((k) => (
          <Col xs={12} sm={8} md={6} lg={4} key={k.titre}>
            <Card variant="borderless" styles={{ body: { padding: 16 } }}>
              <Statistic
                title={<span style={{ fontSize: 12 }}>{k.titre}</span>}
                value={k.valeur}
                groupSeparator=" "
                prefix={<span style={{ color: k.couleur }}>{k.icone}</span>}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Évolution CA — 30 derniers jours" variant="borderless">
            <ReactEChartsCore option={trendOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Répartition stock par famille" variant="borderless">
            <ReactEChartsCore option={familleOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Card title="Top 10 articles vendus" variant="borderless">
        <ReactEChartsCore option={topOption} style={{ height: Math.max(250, top.length * 35) }} />
      </Card>

      <CameraScanner
        open={scanOuvert}
        onClose={() => setScanOuvert(false)}
        onResult={(code) => message.success(`Code détecté : ${code}`)}
      />
    </Space>
  );
}
