import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/auth";
import { offlineDb } from "@/offline/db";

export const api = axios.create({ baseURL: "/api" });

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

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _offlineHandled?: boolean };

    // Offline fallback for GET requests — serve from IndexedDB
    if (!navigator.onLine && original && original.method === "get" && !original._offlineHandled) {
      original._offlineHandled = true;
      const url = original.url ?? "";
      try {
        if (url === "/articles" || url.startsWith("/articles?")) {
          const cached = await offlineDb.articles.toArray();
          if (cached.length > 0) return { data: cached, status: 200, statusText: "OK (offline)", headers: {}, config: original };
        }
        if (url === "/clients" || url.startsWith("/clients?")) {
          const cached = await offlineDb.tiers.where("type").equals("client").toArray();
          if (cached.length > 0) return { data: cached, status: 200, statusText: "OK (offline)", headers: {}, config: original };
        }
        if (url === "/fournisseurs" || url.startsWith("/fournisseurs?")) {
          const cached = await offlineDb.tiers.where("type").equals("fournisseur").toArray();
          if (cached.length > 0) return { data: cached, status: 200, statusText: "OK (offline)", headers: {}, config: original };
        }
      } catch { /* fallthrough */ }
    }

    // Offline fallback for mutations — queue them
    if (!navigator.onLine && original && ["post", "put", "delete"].includes(original.method ?? "")) {
      const url = original.url ?? "";
      const isAuth = url.includes("/auth/");
      if (!isAuth) {
        const { useSyncQueue } = await import("@/offline/syncQueue");
        await useSyncQueue.getState().enqueue({
          method: original.method!.toUpperCase() as "POST" | "PUT" | "DELETE",
          url,
          body: original.data ? JSON.parse(original.data as string) : undefined,
        });
        return { data: { _offline: true, message: "Sauvegardé localement" }, status: 202, statusText: "Queued (offline)", headers: {}, config: original };
      }
    }

    // 401 refresh logic
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
