import { Card, Col, Row, Statistic } from "antd";
import { DropboxOutlined, WarningOutlined, AlertOutlined, DollarOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { kpisStock } from "@/api/stock";
import { useAuthStore } from "@/store/auth";

export default function StockKpis() {
  const devise = useAuthStore((s) => s.utilisateur?.entreprise.devise ?? "DA");
  const { data } = useQuery({ queryKey: ["kpis-stock"], queryFn: kpisStock });

  const cartes = [
    { titre: "Disponibles", valeur: data?.disponible ?? 0, icone: <DropboxOutlined />, couleur: "#52c41a" },
    { titre: "En rupture", valeur: data?.rupture ?? 0, icone: <WarningOutlined />, couleur: "#ff4d4f" },
    { titre: "En alerte", valeur: data?.alerte ?? 0, icone: <AlertOutlined />, couleur: "#faad14" },
    {
      titre: `Valeur de stock (${devise})`,
      valeur: Number(data?.valeur_stock ?? 0),
      icone: <DollarOutlined />,
      couleur: "#722ed1",
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      {cartes.map((c) => (
        <Col xs={12} md={6} key={c.titre}>
          <Card variant="borderless">
            <Statistic
              title={c.titre}
              value={c.valeur}
              groupSeparator=" "
              prefix={<span style={{ color: c.couleur }}>{c.icone}</span>}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}
