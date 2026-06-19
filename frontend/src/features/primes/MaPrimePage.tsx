import { Card, Progress, Space, Statistic, Typography, Row, Col, Tag, Result } from "antd";
import { TrophyOutlined, SmileOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { maPrime } from "@/api/primes";

const PERIODE_LABELS: Record<string, string> = {
  hebdomadaire: "cette semaine",
  mensuelle: "ce mois",
  trimestrielle: "ce trimestre",
};

export default function MaPrimePage() {
  const { data: prime, isLoading, isError } = useQuery({
    queryKey: ["ma-prime"],
    queryFn: maPrime,
  });

  if (isLoading) return <Card loading style={{ maxWidth: 600, margin: "40px auto" }} />;

  if (isError || !prime) {
    return (
      <Result
        icon={<SmileOutlined />}
        title="Aucune prime configurée"
        subTitle="Votre responsable n'a pas encore configuré de prime pour votre compte."
      />
    );
  }

  const total = Number(prime.prime_totale);
  const primeCa = Number(prime.prime_ca);
  const primeRec = Number(prime.prime_recouvrement);
  const periodeLabel = PERIODE_LABELS[prime.periodicite] ?? prime.periodicite;

  return (
    <Space direction="vertical" size="large" style={{ width: "100%", maxWidth: 700, margin: "0 auto" }}>
      <Typography.Title level={3} style={{ textAlign: "center", margin: 0 }}>
        <TrophyOutlined style={{ color: "#faad14", marginRight: 8 }} />
        Ma prime
      </Typography.Title>

      <Card variant="borderless" style={{ textAlign: "center" }}>
        <Typography.Text type="secondary" style={{ fontSize: 14 }}>
          Période : {prime.date_debut} → {prime.date_fin} ({periodeLabel})
        </Typography.Text>

        <div style={{ margin: "24px 0" }}>
          <Statistic
            title="Prime totale à percevoir"
            value={total}
            precision={2}
            suffix="DA"
            valueStyle={{ color: "#faad14", fontSize: 36, fontWeight: 700 }}
          />
        </div>

        <Row gutter={24} justify="center" style={{ marginTop: 16 }}>
          <Col>
            <Card size="small" style={{ minWidth: 200, textAlign: "center" }}>
              <Statistic
                title={<>Prime sur ventes <Tag color="blue">{Number(prime.taux_ca)}%</Tag></>}
                value={primeCa}
                precision={2}
                suffix="DA"
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col>
            <Card size="small" style={{ minWidth: 200, textAlign: "center" }}>
              <Statistic
                title={<>Prime sur recouvrement <Tag color="green">{Number(prime.taux_recouvrement)}%</Tag></>}
                value={primeRec}
                precision={2}
                suffix="DA"
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
        </Row>

        {total > 0 && (
          <div style={{ marginTop: 24 }}>
            <Typography.Text type="secondary">Répartition</Typography.Text>
            <Progress
              percent={total > 0 ? Math.round((primeCa / total) * 100) : 0}
              success={{ percent: total > 0 ? Math.round((primeRec / total) * 100) : 0 }}
              format={() => `${total.toLocaleString("fr-FR")} DA`}
              size={[undefined as any, 20]}
            />
            <Space style={{ marginTop: 4 }}>
              <Tag color="blue">Ventes</Tag>
              <Tag color="green">Recouvrement</Tag>
            </Space>
          </div>
        )}
      </Card>
    </Space>
  );
}
