import { api } from "./client";

export interface Ref {
  id: number;
  nom: string;
}
export interface Famille extends Ref {
  description?: string | null;
}
export interface Unite extends Ref {
  abreviation?: string | null;
}
export interface Taxe extends Ref {
  taux: number;
}

export interface Article {
  id: number;
  reference: string;
  code_barres?: string | null;
  designation: string;
  description?: string | null;
  famille_id?: number | null;
  marque_id?: number | null;
  unite_id?: number | null;
  taxe_id?: number | null;
  prix_achat_moyen: number;
  prix_vente: number;
  prix_vente_gros: number;
  prix_vente_super_gros: number;
  seuil_alerte: number;
  suivi_serie: boolean;
  actif: boolean;
  famille_nom?: string | null;
  marque_nom?: string | null;
  unite_abreviation?: string | null;
  taxe_taux?: number | null;
  quantite: number;
}

export type ArticleInput = Omit<
  Article,
  "id" | "quantite" | "famille_nom" | "marque_nom" | "unite_abreviation" | "taxe_taux"
>;

export async function listerArticles(params: { q?: string; famille_id?: number } = {}): Promise<Article[]> {
  const { data } = await api.get<Article[]>("/articles", { params });
  return data;
}

export async function articleParCodeBarres(code: string): Promise<Article> {
  const { data } = await api.get<Article>(`/articles/code-barres/${encodeURIComponent(code)}`);
  return data;
}

export async function creerArticle(input: Partial<ArticleInput>): Promise<Article> {
  const { data } = await api.post<Article>("/articles", input);
  return data;
}

export async function modifierArticle(id: number, input: Partial<ArticleInput>): Promise<Article> {
  const { data } = await api.put<Article>(`/articles/${id}`, input);
  return data;
}

export async function supprimerArticle(id: number): Promise<void> {
  await api.delete(`/articles/${id}`);
}

export interface ImportResult {
  crees: number;
  ignores: number;
  erreurs: string[];
}

export async function importerArticlesCSV(fichier: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("fichier", fichier);
  const { data } = await api.post<ImportResult>("/articles/import", formData);
  return data;
}

// --- Référentiels ------------------------------------------------------------
export const refApi = (ressource: "familles" | "marques" | "unites" | "taxes") => ({
  lister: async () => (await api.get(`/${ressource}`)).data as Ref[],
  creer: async (payload: Record<string, unknown>) => (await api.post(`/${ressource}`, payload)).data,
  modifier: async (id: number, payload: Record<string, unknown>) =>
    (await api.put(`/${ressource}/${id}`, payload)).data,
  supprimer: async (id: number) => {
    await api.delete(`/${ressource}/${id}`);
  },
});
