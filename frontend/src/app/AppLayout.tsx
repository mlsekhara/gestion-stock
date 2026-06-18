import { useMemo, useState } from "react";
import { Layout, Menu, Select, Dropdown, Avatar, Typography, Grid, Button, theme } from "antd";
import { LogoutOutlined, MenuOutlined, UserOutlined } from "@ant-design/icons";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/auth";
import { MODULES } from "./navigation";
import { brand } from "./theme";
import AdBadge from "@/components/AdBadge";

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

function aLaPermission(permissions: string[], requise?: string) {
  if (!requise) return true;
  return permissions.includes("*") || permissions.includes(requise);
}

export default function AppLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const { token } = theme.useToken();
  const { utilisateur, magasinCourantId, setMagasinCourant, deconnexion } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const estMobile = !screens.lg;
  const permissions = utilisateur?.permissions ?? [];

  const items = useMemo(
    () =>
      MODULES.filter((m) => aLaPermission(permissions, m.permission)).map((m) => ({
        key: m.chemin,
        icon: m.icone,
        label: t(m.i18n),
        children: m.enfants?.map((e) => ({ key: e.chemin, label: t(e.i18n) })),
      })),
    [permissions, t],
  );

  const selectedKey =
    MODULES.flatMap((m) => [m.chemin, ...(m.enfants?.map((e) => e.chemin) ?? [])])
      .filter((c) => c !== "/" )
      .find((c) => location.pathname.startsWith(c)) ??
    (location.pathname === "/" ? "/" : location.pathname);

  function onDeconnexion() {
    deconnexion();
    navigate("/connexion", { replace: true });
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        breakpoint="lg"
        collapsedWidth={estMobile ? 0 : 80}
        collapsed={estMobile ? collapsed : collapsed}
        onCollapse={setCollapsed}
        collapsible
        trigger={null}
        style={{ background: `linear-gradient(180deg, ${brand.dark} 0%, ${brand.darker} 100%)` }}
      >
        <div
          style={{
            height: 56,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 16px",
            color: "#fff",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <AdBadge size={34} />
          {!collapsed && (
            <span
              style={{
                fontFamily: brand.fontDisplay,
                fontWeight: 600,
                fontSize: 18,
                letterSpacing: "0.01em",
                lineHeight: 1,
              }}
            >
              <span
                style={{
                  background: brand.ringGradient,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                AD
              </span>
              <span style={{ color: brand.mist, fontWeight: 500 }}> Phone</span>
            </span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          style={{ background: "transparent" }}
          selectedKeys={[selectedKey]}
          items={items}
          onClick={({ key }) => {
            navigate(key);
            if (estMobile) setCollapsed(true);
          }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: token.colorBgContainer,
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Button type="text" icon={<MenuOutlined />} onClick={() => setCollapsed((c) => !c)} />
          <Typography.Text strong style={{ flex: 1 }} ellipsis>
            {utilisateur?.entreprise.nom}
          </Typography.Text>

          <Select
            value={magasinCourantId ?? undefined}
            onChange={setMagasinCourant}
            style={{ minWidth: 160 }}
            options={(utilisateur?.magasins ?? []).map((m) => ({ value: m.id, label: m.nom }))}
            placeholder={t("commun.magasin")}
          />

          <Dropdown
            menu={{
              items: [
                { key: "logout", icon: <LogoutOutlined />, label: t("auth.deconnexion"), onClick: onDeconnexion },
              ],
            }}
          >
            <span style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} style={{ background: "#13c2c2" }} />
              {!estMobile && <span>{utilisateur?.nom}</span>}
            </span>
          </Dropdown>
        </Header>

        <Content style={{ margin: 16 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
