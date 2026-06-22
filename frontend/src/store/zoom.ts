import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ZoomState {
  level: number;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
}

const STEP = 10;
const MIN = 60;
const MAX = 150;

export const useZoomStore = create<ZoomState>()(
  persist(
    (set) => ({
      level: 100,
      zoomIn: () => set((s) => ({ level: Math.min(s.level + STEP, MAX) })),
      zoomOut: () => set((s) => ({ level: Math.max(s.level - STEP, MIN) })),
      reset: () => set({ level: 100 }),
    }),
    { name: "gs-zoom" },
  ),
);
