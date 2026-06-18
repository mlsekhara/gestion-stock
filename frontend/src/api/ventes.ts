import { api } from "./client";

export type TypeVente = "facture" | "proforma" | "retour";
export type StatutVente = "brouillon" | "validee" | "annulee";

export interface VenteLigne {
  id: number;
  article_id: number;
  article_designation?: string | null;
  quantite: number;
  prix_unitaire: number;
  cout_unitaire?: number | null;
  montant: number;
}

export interface Paiement {
  id: number;
  montant: number;
  methode: string;
  note?: string | null;
  created_at: string;
}

export interface Vente {
  id: number;
  reference: string;
  type: TypeVente;
  statut: StatutVente;
  magasin_id: number;
  client_id?: number | null;
  client_nom?: string | null;
  note?: string | null;
  echeance?: string | null;
  date_validation?: string | null;
  created_at: string;
  montant_total: number;
  montant_paye: number;
  reste_a_payer: number;
  marge_totale: number;
  lignes: VenteLigne[];
  paiements: Paiement[];
}

export interface VenteCreate {
  client_id?: number | null;
  type: TypeVente;
  note?: string;
  echeance?: string | null;
  lignes: { article_id: number; quantite: number; prix_unitaire: number }[];
}

export interface KpisVentes {
  nb_ventes: number;
  chiffre_affaires: number;
  marge: number;
  panier_moyen: number;
}

export async function kpisVentes(): Promise<KpisVentes> {
  return (await api.get<KpisVentes>("/ventes/kpis")).data;
}
export async function listerVentes(): Promise<Vente[]> {
  return (await api.get<Vente[]>("/ventes")).data;
}
export async function creerVente(payload: VenteCreate): Promise<Vente> {
  return (await api.post<Vente>("/ventes", payload)).data;
}
export async function validerVente(id: number): Promise<Vente> {
  return (await api.post<Vente>(`/ventes/${id}/valider`)).data;
}
export async function ajouterPaiementVente(id: number, payload: { montant: number; methode: string; note?: string }): Promise<Vente> {
  return (await api.post<Vente>(`/ventes/${id}/paiements`, payload)).data;
}
export async function supprimerVente(id: number): Promise<void> {
  await api.delete(`/ventes/${id}`);
}
