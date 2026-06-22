import Dexie, { type Table } from "dexie";

export interface CachedArticle {
  id: number;
  reference: string;
  designation: string;
  code_barres?: string | null;
  famille_nom?: string | null;
  marque_nom?: string | null;
  prix_vente: number;
  prix_achat_moyen: number;
  quantite: number;
  seuil_alerte: number;
}

export interface CachedTiers {
  id: number;
  type: "client" | "fournisseur";
  nom: string;
  telephone?: string | null;
  adresse?: string | null;
}

export interface QueuedAction {
  id?: number;
  timestamp: number;
  method: "POST" | "PUT" | "DELETE";
  url: string;
  body?: unknown;
}

class OfflineDB extends Dexie {
  articles!: Table<CachedArticle, number>;
  tiers!: Table<CachedTiers, number>;
  syncQueue!: Table<QueuedAction, number>;

  constructor() {
    super("gs-offline");
    this.version(1).stores({
      articles: "id, reference, code_barres, designation",
      tiers: "id, type, nom",
      syncQueue: "++id, timestamp",
    });
  }
}

export const offlineDb = new OfflineDB();
