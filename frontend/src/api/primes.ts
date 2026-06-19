import { api } from "./client";

export interface PrimeConfig {
  id: number;
  utilisateur_id: number;
  utilisateur_nom: string | null;
  taux_ca: number;
  taux_recouvrement: number;
  periodicite: string;
}

export interface PrimeConfigInput {
  utilisateur_id: number;
  taux_ca: number;
  taux_recouvrement: number;
  periodicite: string;
}

export interface PrimeBilanAdmin {
  utilisateur_id: number;
  utilisateur_nom: string;
  taux_ca: number;
  taux_recouvrement: number;
  periodicite: string;
  ca_realise: number;
  recouvrement_realise: number;
  prime_ca: number;
  prime_recouvrement: number;
  prime_totale: number;
  date_debut: string;
  date_fin: string;
}

export interface PrimeBilanOperateur {
  utilisateur_nom: string;
  taux_ca: number;
  taux_recouvrement: number;
  periodicite: string;
  prime_ca: number;
  prime_recouvrement: number;
  prime_totale: number;
  date_debut: string;
  date_fin: string;
}

export interface UtilisateurResume {
  id: number;
  nom: string;
  email: string;
}

export async function listerConfigs(): Promise<PrimeConfig[]> {
  const { data } = await api.get("/primes/configs");
  return data;
}

export async function creerConfig(input: PrimeConfigInput): Promise<PrimeConfig> {
  const { data } = await api.post("/primes/configs", input);
  return data;
}

export async function modifierConfig(id: number, input: Partial<PrimeConfigInput>): Promise<PrimeConfig> {
  const { data } = await api.put(`/primes/configs/${id}`, input);
  return data;
}

export async function supprimerConfig(id: number): Promise<void> {
  await api.delete(`/primes/configs/${id}`);
}

export async function bilanAdmin(): Promise<PrimeBilanAdmin[]> {
  const { data } = await api.get("/primes/bilan");
  return data;
}

export async function maPrime(): Promise<PrimeBilanOperateur> {
  const { data } = await api.get("/primes/ma-prime");
  return data;
}

export async function listerUtilisateurs(): Promise<UtilisateurResume[]> {
  const { data } = await api.get("/primes/utilisateurs");
  return data;
}
