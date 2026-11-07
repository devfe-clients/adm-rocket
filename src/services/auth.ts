import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  createElement,
  type ReactNode,
} from "react";
import type { AppUser } from "@/lib/types";
import { auth, firestore } from "./firebase";
import { dataProvider } from "./config";
import { seed } from "./seed";

export interface AuthState {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dataProvider !== "firebase") {
      const seedDb = seed();
      const mockUser = seedDb.users.find((u) => u.id === seedDb.currentUserId) ?? null;
      setUser(mockUser);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(firestore, "rocket-gestao/db-v1"));
        if (snap.exists()) {
          const db = snap.data() as import("@/lib/types").DB;
          const appUser = db.users.find((u) => u.email === fbUser.email) ?? null;
          setUser(appUser);
        }
      } catch (e) {
        console.error("Erro ao carregar usuário:", e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao fazer login";
      setError(msg);
      throw e;
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao fazer login com Google";
      setError(msg);
      throw e;
    }
  };

  const signOut = async () => {
    if (dataProvider === "firebase") await firebaseSignOut(auth);
    setUser(null);
  };

  return createElement(
    AuthContext.Provider,
    { value: { user, loading, error, signIn, signInWithGoogle, signOut } },
    children,
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}