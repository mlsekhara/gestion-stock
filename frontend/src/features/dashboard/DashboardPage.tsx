import { useState } from "react";
import { Card, Col, Row, Statistic, Button, Typography, Space, Tag, App } from "antd";
import {
  BarcodeOutlined,
  DropboxOutlined,
  WarningOutlined,
  ShoppingOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/auth";
import CameraScanner from "@/components/CameraScanner";

/**
 * Tableau de bord — Phase 0 : KPIs de démonstration (valeurs fictives).
 * Les chiffres réels seront branchés en Phase 1+ sur l'API.
 */
export default function DashboardPage() {
  const { t } = useTranslation();
  const { utilisateur } = useAuthStore();
  const { message } = App.useApp();
  const [scanOuvert, setScanOuvert] = useState(false);
  const devise = utilisateur?.entreprise.devise ?? "DA";

  const kpis = [
    { titre: "Articles disponibles", valeur: 1899, icone: <DropboxOutlined />, couleur: "#52c41a" },
    { titre: "En rupture", valeur: 617, icone: <WarningOutlined />, couleur: "#ff4d4f" },
    { titre: "Ventes (mois)", valeur: 541, icone: <ShoppingOutlined />, couleur: "#1677ff" },
    { titre: `Valeur de stock (${devise})`, valeur: 22500000, icone: <DollarOutlined />, couleur: "#722ed1" },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {t("nav.tableauDeBord")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {utilisateur?.entreprise.nom} · {utilisateur?.role}
          </Typography.Text>
        </div>
        <Button
          type="primary"
          icon={<BarcodeOutlined />}
          onClick={() => setScanOuvert(true)}
          style={{
            border: "none",
            background: "linear-gradient(135deg, #e81cff 0%, #0e9aa8 100%)",
            boxShadow: "0 4px 14px rgba(232,28,255,0.35)",
          }}
        >
          {t("scanner.demarrer")}
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {kpis.map((k) => (
          <Col xs={12} md={6} key={k.titre}>
            <Card variant="borderless">
              <Statistic
                title={k.titre}
                value={k.valeur}
                groupSeparator=" "
                prefix={<span style={{ color: k.couleur }}>{k.icone}</span>}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="Aperçu" variant="borderless">
        <Space direction="vertical">
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Squelette de la Phase 0. Les modules ci-dessous arrivent dans les prochaines phases :
          </Typography.Paragraph>
          <Space wrap>
            <Tag color="blue">Phase 1 · Catalogue & Stock</Tag>
            <Tag color="gold">Phase 2 · Achats</Tag>
            <Tag color="green">Phase 3 · Ventes</Tag>
            <Tag color="purple">Phase 4 · Tableau de bord & exports</Tag>
          </Space>
        </Space>
      </Card>

      <CameraScanner
        open={scanOuvert}
        onClose={() => setScanOuvert(false)}
        onResult={(code) => message.success(`${t("scanner.resultat")} : ${code}`)}
      />
    </Space>
  );
}
