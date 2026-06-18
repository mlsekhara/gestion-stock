import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { useQuery } from "@tanstack/react-query";
import { profilCourant } from "@/api/auth";
import { useAuthStore } from "@/store/auth";

/** Protège les routes : exige un jeton et charge le profil si absent. */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { accessToken, utilisateur, setUtilisateur, deconnexion } = useAuthStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["profil"],
    queryFn: profilCourant,
    enabled: !!accessToken && !utilisateur,
  });

  useEffect(() => {
    if (data) setUtilisateur(data);
  }, [data, setUtilisateur]);

  useEffect(() => {
    if (isError) deconnexion();
  }, [isError, deconnexion]);

  if (!accessToken) {
    return <Navigate to="/connexion" replace state={{ from: location }} />;
  }
  if (isLoading || !utilisateur) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <Spin size="large" />
      </div>
    );
  }
  return <>{children}</>;
}
