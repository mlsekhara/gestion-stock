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
import RelevePage from "@/features/tiers/RelevePage";
import BrandGuidePage from "@/features/marque/BrandGuidePage";
import PrimesAdminPage from "@/features/primes/PrimesAdminPage";
import MaPrimePage from "@/features/primes/MaPrimePage";
import UtilisateursPage from "@/features/parametres/UtilisateursPage";

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
      { path: "tiers/clients/:clientId/releve", element: <RelevePage /> },
      { path: "tiers/fournisseurs", element: <FournisseursPage /> },
      { path: "parametres", element: <Navigate to="/parametres/referentiels" replace /> },
      { path: "parametres/referentiels", element: <ReferentielsPage /> },
      { path: "parametres/utilisateurs", element: <UtilisateursPage /> },
      { path: "primes", element: <PrimesAdminPage /> },
      { path: "ma-prime", element: <MaPrimePage /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
