import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  runTransaction,
  type Unsubscribe,
} from "firebase/firestore";
import type { DB } from "@/lib/types";
import { firestore } from "./firebase";
import { seed, migrate } from "./seed";
import type { Repository } from "./repository";

const DOC_PATH = "rocket-gestao/db-v1";

let cache: DB | null = null;
let unsub: Unsubscribe | null = null;
const subscribers = new Set<(db: DB) => void>();

async function saveSafetyBackup(db: DB, isDirector = false): Promise<void> {
  if (!isDirector) return;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const backupRef = doc(firestore, "rocket-gestao", `backup-${today}`);
    await setDoc(backupRef, {
      ...db,
      _backupDate: today,
      _lastBackupAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Aviso silencioso: falha ao gravar backup diário no Firebase:", err);
  }
}

async function hydrate(): Promise<void> {
  const ref = doc(firestore, DOC_PATH);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    cache = migrate(snap.data() as DB);
  } else {
    cache = seed();
    await setDoc(ref, cache);
  }

  if (unsub) unsub();
  unsub = onSnapshot(ref, (s) => {
    if (s.exists()) {
      cache = migrate(s.data() as DB);
      subscribers.forEach((cb) => {
        try {
          cb(cache!);
        } catch (err) {
          console.error("Erro ao notificar subscriber do Firestore:", err);
        }
      });
    }
  });
}

export const hydrateFirebase = (): Promise<void> => hydrate();

export function cacheUsers(users: DB["users"]): void {
  if (cache) cache = { ...cache, users };
}

export const firebaseRepository: Repository = {
  load(): DB {
    return cache ?? seed();
  },
  save(db: DB): void {
    cache = db;
    void setDoc(doc(firestore, DOC_PATH), db);
  },
  async update(mutator: (draft: DB) => void): Promise<DB> {
    const ref = doc(firestore, DOC_PATH);

    const updated = await runTransaction(firestore, async (transaction) => {
      const snap = await transaction.get(ref);
      const serverData = snap.exists() ? migrate(snap.data() as DB) : (cache ?? seed());
      const next = structuredClone(serverData);
      mutator(next);
      transaction.set(ref, next);
      return next;
    });

    cache = updated;

    subscribers.forEach((cb) => {
      try {
        cb(updated);
      } catch (err) {
        console.error("Erro ao notificar subscriber após transaction:", err);
      }
    });

    return updated;
  },
  subscribe(cb: (db: DB) => void): () => void {
    subscribers.add(cb);
    if (cache) cb(cache);
    return () => {
      subscribers.delete(cb);
    };
  },
};
