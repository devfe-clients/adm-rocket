import type { DB } from "@/lib/types";
import { dataProvider } from "./config";
import { seed } from "./seed";
import { firebaseRepository } from "./firebaseRepository";

export interface Repository { load(): DB; save(db: DB): void }

const KEY = "rocket-gestao-db-v1";

export const localRepository: Repository = {
  load() {
    if (typeof window === "undefined") return seed();
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as DB) : seed();
    } catch { return seed(); }
  },
  save(db) { if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(db)); },
};

export function getRepository(): Repository {
  return dataProvider === "firebase" ? firebaseRepository : localRepository;
}

export const resetLocal = () => { localStorage.removeItem(KEY); location.reload(); };
