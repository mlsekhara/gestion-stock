import { useState } from "react";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { connexion, profilCourant } from "@/api/auth";
import { useAuthStore } from "@/store/auth";
import { brand } from "@/app/theme";
import AdSign from "@/components/AdSign";

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setTokens, setUtilisateur } = useAuthStore();
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function onFinish(values: { email: string; motDePasse: string }) {
    setErreur(null);
    setChargement(true);
    try {
      const tokens = await connexion(values.email, values.motDePasse);
      setTokens(tokens.access_token, tokens.refresh_token);
      setUtilisateur(await profilCourant());
      navigate("/", { replace: true });
    } catch {
      setErreur(t("auth.erreurIdentifiants"));
    } finally {
      setChargement(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        padding: 16,
        background: brand.loginBg,
      }}
    >
      {/* Enseigne lumineuse de la marque (storefront) */}
      <AdSign style={{ width: "min(440px, 100%)" }} />

      <Card
        style={{
          width: 392,
          maxWidth: "100%",
          boxShadow: "0 18px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
        }}
        variant="borderless"
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t("app.titre")}
          </Typography.Title>
          <Typography.Text type="secondary">{t("auth.bienvenue")}</Typography.Text>
        </div>

        {erreur && <Alert type="error" message={erreur} showIcon style={{ marginBottom: 16 }} />}

        <Form layout="vertical" onFinish={onFinish} initialValues={{ email: "admin@demo.dz", motDePasse: "admin123" }}>
          <Form.Item name="email" label={t("auth.email")} rules={[{ required: true, type: "email" }]}>
            <Input prefix={<MailOutlined />} size="large" placeholder="vous@exemple.dz" />
          </Form.Item>
          <Form.Item name="motDePasse" label={t("auth.motDePasse")} rules={[{ required: true }]}>
            <Input.Password prefix={<LockOutlined />} size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={chargement}>
            {t("auth.seConnecter")}
          </Button>
        </Form>

        <Alert
          style={{ marginTop: 16 }}
          type="info"
          showIcon
          message={t("auth.compteDemo")}
          description="admin@demo.dz / admin123"
        />
      </Card>
    </div>
  );
}
