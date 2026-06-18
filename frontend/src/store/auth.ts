import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UtilisateurCourant } from "@/types";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  utilisateur: UtilisateurCourant | null;
  magasinCourantId: number | null;
  setTokens: (access: string, refresh: string) => void;
  setUtilisateur: (u: UtilisateurCourant) => void;
  setMagasinCourant: (id: number) => void;
  deconnexion: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      utilisateur: null,
      magasinCourantId: null,
      setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
      setUtilisateur: (u) =>
        set((state) => ({
          utilisateur: u,
          magasinCourantId:
            state.magasinCourantId ?? u.magasin_id ?? u.magasins[0]?.id ?? null,
        })),
      setMagasinCourant: (id) => set({ magasinCourantId: id }),
      deconnexion: () =>
        set({ accessToken: null, refreshToken: null, utilisateur: null, magasinCourantId: null }),
    }),
    { name: "gs-auth" },
  ),
);
