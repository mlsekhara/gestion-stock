import {
  AppstoreOutlined,
  DashboardOutlined,
  DropboxOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";

export interface ModuleNav {
  cle: string;
  i18n: string;
  chemin: string;
  icone: ReactNode;
  permission?: string;
  enfants?: { i18n: string; chemin: string }[];
}

/** Modules de navigation, inspirés de la barre de PROST. */
export const MODULES: ModuleNav[] = [
  { cle: "dashboard", i18n: "nav.tableauDeBord", chemin: "/", icone: <DashboardOutlined />, permission: "tableau_de_bord:lire" },
  {
    cle: "stock",
    i18n: "nav.stock",
    chemin: "/stock",
    icone: <DropboxOutlined />,
    permission: "stock:lire",
    enfants: [
      { i18n: "nav.articles", chemin: "/stock/articles" },
      { i18n: "nav.mouvements", chemin: "/stock/mouvements" },
      { i18n: "nav.inventaire", chemin: "/stock/inventaire" },
    ],
  },
  { cle: "achats", i18n: "nav.achats", chemin: "/achats", icone: <ShoppingCartOutlined />, permission: "achats:lire" },
  { cle: "ventes", i18n: "nav.ventes", chemin: "/ventes", icone: <ShopOutlined />, permission: "ventes:lire" },
  {
    cle: "tiers",
    i18n: "nav.tiers",
    chemin: "/tiers",
    icone: <TeamOutlined />,
    permission: "tiers:lire",
    enfants: [
      { i18n: "nav.clients", chemin: "/tiers/clients" },
      { i18n: "nav.fournisseurs", chemin: "/tiers/fournisseurs" },
    ],
  },
  { cle: "parametres", i18n: "nav.parametres", chemin: "/parametres", icone: <SettingOutlined />, permission: "parametres:gerer" },
];

export const ICONE_DEFAUT = <AppstoreOutlined />;
