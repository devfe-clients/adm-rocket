import type { DB } from "@/lib/types";
import { dataProvider } from "./config";
import { seed } from "./seed";

/**
 * Camada de persistência modular. Cada provider implementa load/save do documento DB.
 * Para Firestore: crie FirebaseRepository (coleções companies, events, payables, receivables,
 * users, settings) implementando esta mesma interface e troque em `getRepository`.
 */
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
  // TODO: quando dataProvider === "firebase", retornar o FirebaseRepository.
  void dataProvider;
  return localRepository;
}

export const resetLocal = () => { localStorage.removeItem(KEY); location.reload(); };
