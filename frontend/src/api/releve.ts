import { api } from "./client";

export interface ReleveEntry {
  date: string;
  type: "vente" | "paiement";
  reference: string;
  designation: string;
  quantite: number | null;
  prix_unitaire: number | null;
  debit: number;
  credit: number;
  solde: number;
}

export interface ReleveClient {
  id: number;
  nom: string;
  telephone?: string | null;
  adresse?: string | null;
}

export interface ReleveData {
  client: ReleveClient;
  date_debut: string | null;
  date_fin: string | null;
  entries: ReleveEntry[];
  total_debit: number;
  total_credit: number;
  solde_final: number;
}

export async function getReleve(
  clientId: number,
  dateDebut?: string,
  dateFin?: string,
): Promise<ReleveData> {
  const params: Record<string, string> = {};
  if (dateDebut) params.date_debut = dateDebut;
  if (dateFin) params.date_fin = dateFin;
  const { data } = await api.get<ReleveData>(`/clients/${clientId}/releve`, { params });
  return data;
}
