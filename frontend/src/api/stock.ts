import { api } from "./client";

export interface KpisStock {
  nb_articles: number;
  disponible: number;
  rupture: number;
  alerte: number;
  valeur_stock: number;
}

export type TypeMouvement = "entree" | "sortie" | "ajustement" | "transfert";

export interface MouvementInput {
  article_id: number;
  type: TypeMouvement;
  quantite: number;
  cout_unitaire?: number | null;
  motif?: string | null;
  note?: string | null;
  magasin_destination_id?: number | null;
}

export interface Mouvement {
  id: number;
  article_id: number;
  article_designation?: string | null;
  magasin_id: number;
  magasin_destination_id?: number | null;
  type: TypeMouvement;
  quantite: number;
  cout_unitaire?: number | null;
  motif?: string | null;
  created_at: string;
}

export interface InventaireLigne {
  id: number;
  article_id: number;
  article_designation?: string | null;
  quantite_theorique: number;
  quantite_comptee: number;
  ecart: number;
}

export interface Inventaire {
  id: number;
  reference: string;
  magasin_id: number;
  statut: "brouillon" | "valide";
  note?: string | null;
  created_at: string;
  lignes: InventaireLigne[];
}

export async function kpisStock(): Promise<KpisStock> {
  return (await api.get<KpisStock>("/stock/kpis")).data;
}

export async function creerMouvement(input: MouvementInput): Promise<Mouvement> {
  return (await api.post<Mouvement>("/stock/mouvements", input)).data;
}

export async function listerMouvements(): Promise<Mouvement[]> {
  return (await api.get<Mouvement[]>("/stock/mouvements")).data;
}

export async function listerInventaires(): Promise<Inventaire[]> {
  return (await api.get<Inventaire[]>("/stock/inventaires")).data;
}

export async function creerInventaire(payload: {
  note?: string;
  lignes: { article_id: number; quantite_comptee: number }[];
}): Promise<Inventaire> {
  return (await api.post<Inventaire>("/stock/inventaires", payload)).data;
}

export async function validerInventaire(id: number): Promise<Inventaire> {
  return (await api.post<Inventaire>(`/stock/inventaires/${id}/valider`)).data;
}
