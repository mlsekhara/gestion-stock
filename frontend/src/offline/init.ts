import { refreshAllCaches } from "./cacheManager";
import { useSyncQueue } from "./syncQueue";

let initialized = false;

export async function initOffline(): Promise<void> {
  if (initialized) return;
  initialized = true;

  await useSyncQueue.getState().load();

  if (navigator.onLine) {
    await refreshAllCaches();
    await useSyncQueue.getState().flush();
  }

  window.addEventListener("online", async () => {
    await refreshAllCaches();
    await useSyncQueue.getState().flush();
  });
}
