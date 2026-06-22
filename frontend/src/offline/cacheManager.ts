import { offlineDb, type CachedArticle, type CachedTiers } from "./db";
import { api } from "@/api/client";

export async function cacheArticles(): Promise<void> {
  try {
    const { data } = await api.get("/articles");
    const articles: CachedArticle[] = data.map((a: any) => ({
      id: a.id,
      reference: a.reference,
      designation: a.designation,
      code_barres: a.code_barres,
      famille_nom: a.famille_nom,
      marque_nom: a.marque_nom,
      prix_vente: Number(a.prix_vente),
      prix_achat_moyen: Number(a.prix_achat_moyen),
      quantite: Number(a.quantite),
      seuil_alerte: Number(a.seuil_alerte),
    }));
    await offlineDb.articles.clear();
    await offlineDb.articles.bulkPut(articles);
  } catch {
    // offline — keep existing cache
  }
}

export async function cacheTiers(): Promise<void> {
  try {
    const [{ data: clients }, { data: fournisseurs }] = await Promise.all([
      api.get("/clients"),
      api.get("/fournisseurs"),
    ]);
    const all: CachedTiers[] = [
      ...clients.map((c: any) => ({ id: c.id, type: "client" as const, nom: c.nom, telephone: c.telephone, adresse: c.adresse })),
      ...fournisseurs.map((f: any) => ({ id: f.id, type: "fournisseur" as const, nom: f.nom, telephone: f.telephone, adresse: f.adresse })),
    ];
    await offlineDb.tiers.clear();
    await offlineDb.tiers.bulkPut(all);
  } catch {
    // offline — keep existing cache
  }
}

export async function getCachedArticles(): Promise<CachedArticle[]> {
  return offlineDb.articles.toArray();
}

export async function getCachedClients(): Promise<CachedTiers[]> {
  return offlineDb.tiers.where("type").equals("client").toArray();
}

export async function refreshAllCaches(): Promise<void> {
  await Promise.all([cacheArticles(), cacheTiers()]);
}
