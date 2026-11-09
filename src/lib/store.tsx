import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { DB } from "./types";
import { getRepository } from "@/services/repository";
import { hydrateFirebase } from "@/services/firebaseRepository";
import { dataProvider } from "@/services/config";
import { seed } from "@/services/seed";
import { AuthContext } from "@/services/auth";

type Ctx = { db: DB; update: (fn: (db: DB) => void) => void; ready: boolean };
const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(seed);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (dataProvider === "firebase") {
      hydrateFirebase().then(() => {
        setDb(getRepository().load());
        setReady(true);
      }).catch((e) => {
        console.error("Falha ao hidratar Firebase:", e);
        setDb(getRepository().load());
        setReady(true);
      });
    } else {
      setDb(getRepository().load());
      setReady(true);
    }
  }, []);
  const update = (fn: (db: DB) => void) =>
    setDb((prev) => { const next = structuredClone(prev); fn(next); getRepository().save(next); return next; });
  return <StoreCtx.Provider value={{ db, update, ready }}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("StoreProvider ausente");
  const auth = useContext(AuthContext);
  // Na nuvem, o perfil vem SEMPRE do login (o currentUserId é compartilhado no documento).
  const user = dataProvider === "firebase"
    ? c.db.users.find((u) => u.email.toLowerCase() === auth?.user?.email.toLowerCase()) ?? auth?.user ?? undefined
    : c.db.users.find((u) => u.id === c.db.currentUserId) ?? c.db.users[0];
  const isDirector = user?.role === "diretor";
  const visibleCompanies = c.db.companies.filter((co) => isDirector || user?.companyIds.includes(co.id));
  return { ...c, user, isDirector, visibleCompanies };
}
