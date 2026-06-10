import { create } from "zustand";
import type { UniverseRow } from "../types/UniverseRow";

export type UniverseMap = Record<string, UniverseRow>;

type MarketState = {
  universe: UniverseMap;
  updateBatch: (rows: UniverseRow[]) => void;
  updateOne: (row: UniverseRow) => void;
  clearUniverse: () => void;
  getUniverseAsArray: () => UniverseRow[];
};

export const useMarketStore = create<MarketState>((set, get) => ({
  universe: {},

  updateBatch: (rows) =>
    set((state) => {
      const next = { ...state.universe };
      for (const r of rows) {
        if (r && r.symbol) {
          next[r.symbol] = { ...next[r.symbol], ...r };
        }
      }
      return { universe: next };
    }),

  updateOne: (row) =>
    set((state) => {
      if (!row || !row.symbol) return state;
      
      return {
        universe: {
          ...state.universe,
          [row.symbol]: {
            ...state.universe[row.symbol],
            ...row,
          },
        },
      };
    }),

  clearUniverse: () => set({ universe: {} }),

  getUniverseAsArray: () => {
    return Object.values(get().universe);
  },
}));
