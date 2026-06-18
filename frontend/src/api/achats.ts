import { api } from "./client";

export type StatutAchat = "commande" | "recue" | "annulee";

export interface AchatLigne {
  id: number;
  article_id: number;
  article_designation?: string | null;
  quantite: number;
  cout_unitaire: number;
  montant: number;
}

export interface Paiement {
  id: number;
  montant: number;
  methode: string;
  note?: string | null;
  created_at: string;
}

export interface Achat {
  id: number;
  reference: string;
  statut: StatutAchat;
  magasin_id: number;
  fournisseur_id?: number | null;
  fournisseur_nom?: string | null;
  note?: string | null;
  echeance?: string | null;
  date_reception?: string | null;
  created_at: string;
  montant_total: number;
  montant_paye: number;
  reste_a_payer: number;
  lignes: AchatLigne[];
  paiements: Paiement[];
}

export interface AchatCreate {
  fournisseur_id?: number | null;
  note?: string;
  echeance?: string | null;
  lignes: { article_id: number; quantite: number; cout_unitaire: number }[];
}

export async function listerAchats(): Promise<Achat[]> {
  return (await api.get<Achat[]>("/achats")).data;
}
export async function detailAchat(id: number): Promise<Achat> {
  return (await api.get<Achat>(`/achats/${id}`)).data;
}
export async function creerAchat(payload: AchatCreate): Promise<Achat> {
  return (await api.post<Achat>("/achats", payload)).data;
}
export async function receptionnerAchat(id: number): Promise<Achat> {
  return (await api.post<Achat>(`/achats/${id}/receptionner`)).data;
}
export async function ajouterPaiement(id: number, payload: { montant: number; methode: string; note?: string }): Promise<Achat> {
  return (await api.post<Achat>(`/achats/${id}/paiements`, payload)).data;
}
export async function supprimerAchat(id: number): Promise<void> {
  await api.delete(`/achats/${id}`);
}
