import { api } from "./client";
import type { TokenPair, UtilisateurCourant } from "@/types";

export async function connexion(email: string, motDePasse: string): Promise<TokenPair> {
  // L'endpoint attend un formulaire OAuth2 (username/password).
  const form = new URLSearchParams();
  form.set("username", email);
  form.set("password", motDePasse);
  const { data } = await api.post<TokenPair>("/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data;
}

export async function profilCourant(): Promise<UtilisateurCourant> {
  const { data } = await api.get<UtilisateurCourant>("/auth/me");
  return data;
}
