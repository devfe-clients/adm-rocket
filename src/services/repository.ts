import type { DB } from "@/lib/types";
import { dataProvider } from "./config";
import { seed } from "./seed";
import { firebaseRepository } from "./firebaseRepository";
import type { AppUser } from "@/lib/types";
import { userSaveSchema } from "./user-management";

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

// Account writes remain behind the repository boundary; passwords never enter DB.
export async function saveUsers(users: (AppUser & { password?: string })[]): Promise<AppUser[]> {
  if (dataProvider !== "firebase") throw new Error("O modo de prévia não cria contas reais. Configure o Firebase para cadastrar usuários.");
  const { auth } = await import("./firebase");
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Entre novamente antes de salvar usuários.");
  const token = await currentUser.getIdToken(true);
  const data = userSaveSchema.parse({ users, token });
  const { saveUserAccounts } = await import("./users.functions");
  return saveUserAccounts({ data });
}
