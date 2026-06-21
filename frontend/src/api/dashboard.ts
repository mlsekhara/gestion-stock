import { api } from "./client";

export interface KpisDashboard {
  nb_articles: number;
  disponible: number;
  rupture: number;
  alerte: number;
  valeur_stock: number;
  nb_ventes: number;
  chiffre_affaires: number;
  marge: number;
  panier_moyen: number;
  total_achats: number;
  nb_clients: number;
  nb_fournisseurs: number;
  total_creances: number;
}

export interface VenteJour {
  jour: string;
  ca: number;
  nb: number;
}

export interface TopArticle {
  designation: string;
  qte_vendue: number;
  ca: number;
}

export interface StockFamille {
  famille: string;
  nb_articles: number;
  valeur: number;
}

export async function kpisDashboard(periode?: string): Promise<KpisDashboard> {
  const params = periode ? { periode } : {};
  return (await api.get<KpisDashboard>("/dashboard/kpis", { params })).data;
}

export async function ventesParJour(jours = 30): Promise<VenteJour[]> {
  return (await api.get<VenteJour[]>("/dashboard/ventes-par-jour", { params: { jours } })).data;
}

export async function topArticles(limite = 10, periode?: string): Promise<TopArticle[]> {
  const params: Record<string, any> = { limite };
  if (periode) params.periode = periode;
  return (await api.get<TopArticle[]>("/dashboard/top-articles", { params })).data;
}

export async function stockParFamille(): Promise<StockFamille[]> {
  return (await api.get<StockFamille[]>("/dashboard/stock-par-famille")).data;
}
