import { api } from "./client";

export interface UtilisateurOut {
  id: number;
  nom: string;
  email: string;
  role_id: number | null;
  role_nom: string | null;
  magasin_id: number | null;
  actif: boolean;
}

export interface UtilisateurCreate {
  nom: string;
  email: string;
  mot_de_passe: string;
  role_id?: number | null;
  magasin_id?: number | null;
  actif?: boolean;
}

export interface UtilisateurUpdate {
  nom?: string;
  email?: string;
  role_id?: number | null;
  magasin_id?: number | null;
  actif?: boolean;
}

export interface RoleOut {
  id: number;
  nom: string;
  description: string | null;
}

export async function listerUtilisateurs(): Promise<UtilisateurOut[]> {
  const { data } = await api.get("/utilisateurs");
  return data;
}

export async function creerUtilisateur(input: UtilisateurCreate): Promise<UtilisateurOut> {
  const { data } = await api.post("/utilisateurs", input);
  return data;
}

export async function modifierUtilisateur(id: number, input: UtilisateurUpdate): Promise<UtilisateurOut> {
  const { data } = await api.put(`/utilisateurs/${id}`, input);
  return data;
}

export async function resetPassword(id: number, mot_de_passe: string): Promise<void> {
  await api.post(`/utilisateurs/${id}/reset-password`, { mot_de_passe });
}

export async function supprimerUtilisateur(id: number): Promise<void> {
  await api.delete(`/utilisateurs/${id}`);
}

export async function listerRoles(): Promise<RoleOut[]> {
  const { data } = await api.get("/utilisateurs/roles");
  return data;
}
