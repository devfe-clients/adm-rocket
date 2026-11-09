import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { firebaseConfig, dataProvider } from "./config";

// Sem chaves (modo local/testes) usa um app vazio para não quebrar ao carregar.
const cfg = dataProvider === "firebase" ? firebaseConfig : { apiKey: "local-mode", projectId: "local-mode", appId: "local" };
const app = getApps().length === 0 ? initializeApp(cfg) : getApps()[0]!;

export const firestore = getFirestore(app);
export const auth = getAuth(app);