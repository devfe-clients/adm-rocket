import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { DB } from "./types";
import { getRepository } from "@/services/repository";
import { hydrateFirebase } from "@/services/firebaseRepository";
import { dataProvider } from "@/services/config";
import { seed, migrate } from "@/services/seed";
import { AuthContext } from "@/services/auth";
import { toast } from "sonner";

type Ctx = {
  db: DB;
  update: (fn: (db: DB) => void) => void;
  refresh: () => void;
  ready: boolean;
};
const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(seed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const repo = getRepository();

    let unsub: (() => void) | undefined;
    if (repo.subscribe) {
      unsub = repo.subscribe((remoteDb) => {
        setDb(migrate(remoteDb));
      });
    }

    if (dataProvider === "firebase") {
      hydrateFirebase()
        .then(() => {
          setDb(migrate(repo.load()));
          setReady(true);
        })
        .catch((e) => {
          console.error("Falha ao hidratar Firebase:", e);
          setDb(migrate(repo.load()));
          setReady(true);
        });
    } else {
      setDb(migrate(repo.load()));
      setReady(true);
    }

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = (fn: (db: DB) => void) => {
    setDb((prev) => {
      const optimistic = structuredClone(prev);
      fn(optimistic);
      return optimistic;
    });

    const repo = getRepository();
    if (pendingRef.current) clearTimeout(pendingRef.current);
    pendingRef.current = setTimeout(() => {
      if (repo.update) {
repo.update(fn).catch((err) => {
  console.error("Erro na transação do Firebase:", err);
  setDb(migrate(repo.load()));
  toast.error(
    err instanceof Error && err.message
      ? `Erro ao salvar: ${err.message}`
      : "Sem permissão para salvar. Peça ao diretor para conferir seu acesso.",
  );
});
      } else {
        setDb((prev) => {
          const next = structuredClone(prev);
          fn(next);
          repo.save(next);
          return next;
        });
      }
    }, 600);
  };

  const refresh = () => setDb(migrate(getRepository().load()));

  return <StoreCtx.Provider value={{ db, update, refresh, ready }}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("StoreProvider ausente");
  const auth = useContext(AuthContext);
  const user = dataProvider === "firebase"
    ? c.db.users.find((u) => u.email.toLowerCase() === auth?.user?.email.toLowerCase()) ?? auth?.user ?? undefined
    : c.db.users.find((u) => u.id === c.db.currentUserId) ?? c.db.users[0];
  const isDirector = user?.role === "diretor";
  const visibleCompanies = c.db.companies.filter((co) => isDirector || user?.companyIds.includes(co.id));
  return { ...c, user, isDirector, visibleCompanies };
}
