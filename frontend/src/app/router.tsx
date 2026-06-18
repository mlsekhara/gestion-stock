import { createBrowserRouter, Navigate } from "react-router-dom";
import RequireAuth from "@/components/RequireAuth";
import AppLayout from "./AppLayout";
import LoginPage from "@/features/auth/LoginPage";
import DashboardPage from "@/features/dashboard/DashboardPage";
import ArticlesPage from "@/features/stock/ArticlesPage";
import MouvementsPage from "@/features/stock/MouvementsPage";
import InventairePage from "@/features/stock/InventairePage";
import ReferentielsPage from "@/features/parametres/ReferentielsPage";
import AchatsPage from "@/features/achats/AchatsPage";
import FournisseursPage from "@/features/tiers/FournisseursPage";
import VentesPage from "@/features/ventes/VentesPage";
import ClientsPage from "@/features/tiers/ClientsPage";
import BrandGuidePage from "@/features/marque/BrandGuidePage";

export const router = createBrowserRouter([
  { path: "/connexion", element: <LoginPage /> },
  { path: "/marque", element: <BrandGuidePage /> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "stock", element: <Navigate to="/stock/articles" replace /> },
      { path: "stock/articles", element: <ArticlesPage /> },
      { path: "stock/mouvements", element: <MouvementsPage /> },
      { path: "stock/inventaire", element: <InventairePage /> },
      { path: "achats", element: <AchatsPage /> },
      { path: "ventes", element: <VentesPage /> },
      { path: "tiers", element: <Navigate to="/tiers/fournisseurs" replace /> },
      { path: "tiers/clients", element: <ClientsPage /> },
      { path: "tiers/fournisseurs", element: <FournisseursPage /> },
      { path: "parametres", element: <ReferentielsPage /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
