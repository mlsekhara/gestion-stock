import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/auth";

export const api = axios.create({ baseURL: "/api" });

// Ajoute le jeton d'accès et le magasin courant à chaque requête.
api.interceptors.request.use((config) => {
  const { accessToken, magasinCourantId } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (magasinCourantId) {
    config.headers["X-Magasin-Id"] = String(magasinCourantId);
  }
  return config;
});

let refreshEnCours: Promise<string | null> | null = null;

async function rafraichir(): Promise<string | null> {
  const { refreshToken, setTokens, deconnexion } = useAuthStore.getState();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post("/api/auth/refresh", { refresh_token: refreshToken });
    setTokens(data.access_token, data.refresh_token);
    return data.access_token as string;
  } catch {
    deconnexion();
    return null;
  }
}

// Sur 401, tente un rafraîchissement unique puis rejoue la requête.
api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const estAuth = original?.url?.includes("/auth/login") || original?.url?.includes("/auth/refresh");
    if (error.response?.status === 401 && original && !original._retry && !estAuth) {
      original._retry = true;
      refreshEnCours = refreshEnCours ?? rafraichir();
      const nouveau = await refreshEnCours;
      refreshEnCours = null;
      if (nouveau) {
        original.headers.Authorization = `Bearer ${nouveau}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);
