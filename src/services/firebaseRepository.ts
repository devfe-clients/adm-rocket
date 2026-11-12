import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import type { DB } from "@/lib/types";
import { firestore } from "./firebase";
import { seed } from "./seed";
import type { Repository } from "./repository";

const DOC_PATH = "rocket-gestao/db-v1";

let cache: DB | null = null;
let unsub: Unsubscribe | null = null;

async function hydrate(): Promise<void> {
  const ref = doc(firestore, DOC_PATH);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    cache = snap.data() as DB;
  } else {
    cache = seed();
    await setDoc(ref, cache);   
  }

  if (unsub) unsub();
  unsub = onSnapshot(ref, (s) => {
    if (s.exists()) cache = s.data() as DB;
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
};