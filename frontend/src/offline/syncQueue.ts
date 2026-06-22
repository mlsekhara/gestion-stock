import { create } from "zustand";
import { api } from "@/api/client";
import { offlineDb, type QueuedAction } from "./db";

interface SyncQueueState {
  queue: QueuedAction[];
  syncing: boolean;
  load: () => Promise<void>;
  enqueue: (action: Omit<QueuedAction, "id" | "timestamp">) => Promise<void>;
  flush: () => Promise<void>;
}

export const useSyncQueue = create<SyncQueueState>((set, get) => ({
  queue: [],
  syncing: false,

  load: async () => {
    const items = await offlineDb.syncQueue.orderBy("timestamp").toArray();
    set({ queue: items });
  },

  enqueue: async (action) => {
    const entry: QueuedAction = { ...action, timestamp: Date.now() };
    await offlineDb.syncQueue.add(entry);
    await get().load();
  },

  flush: async () => {
    if (get().syncing) return;
    set({ syncing: true });

    try {
      const items = await offlineDb.syncQueue.orderBy("timestamp").toArray();
      for (const item of items) {
        try {
          if (item.method === "POST") {
            await api.post(item.url, item.body);
          } else if (item.method === "PUT") {
            await api.put(item.url, item.body);
          } else if (item.method === "DELETE") {
            await api.delete(item.url);
          }
          await offlineDb.syncQueue.delete(item.id!);
        } catch (err: any) {
          if (err?.response?.status >= 400 && err?.response?.status < 500) {
            await offlineDb.syncQueue.delete(item.id!);
          } else {
            break;
          }
        }
      }
    } finally {
      await get().load();
      set({ syncing: false });
    }
  },
}));
