import { api } from "./client";

export interface Tiers {
  id: number;
  type: "fournisseur" | "client";
  nom: string;
  telephone?: string | null;
  email?: string | null;
  adresse?: string | null;
  rc?: string | null;
  nif?: string | null;
  actif: boolean;
}

export type TiersRessource = "fournisseurs" | "clients";

export const tiersApi = (ressource: TiersRessource) => ({
  lister: async (q?: string) => (await api.get<Tiers[]>(`/${ressource}`, { params: { q } })).data,
  creer: async (payload: Partial<Tiers>) => (await api.post<Tiers>(`/${ressource}`, payload)).data,
  modifier: async (id: number, payload: Partial<Tiers>) =>
    (await api.put<Tiers>(`/${ressource}/${id}`, payload)).data,
  supprimer: async (id: number) => {
    await api.delete(`/${ressource}/${id}`);
  },
});
