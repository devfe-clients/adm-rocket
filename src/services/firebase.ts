import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { firebaseConfig, dataProvider } from "./config";

// Sem chaves (modo local/testes) usa um app de mentira para não quebrar ao carregar.
const NAME = `rocket-${dataProvider}`;
const cfg = dataProvider === "firebase"
  ? firebaseConfig
  : { apiKey: "AIzaSyLocalModePlaceholder000000000000", authDomain: "local.invalid", projectId: "local-mode", appId: "1:0:web:0" };
const app = getApps().find((a) => a.name === NAME) ?? initializeApp(cfg, NAME);

export const firestore = getFirestore(app);
export const auth = getAuth(app);
