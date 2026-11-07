// Configuração de integração. Preencha as variáveis em .env (veja .env.example).
// Enquanto VITE_FIREBASE_PROJECT_ID estiver vazio, o app usa dados locais (mock + localStorage).
export const firebaseConfig = {
  apiKey: import.meta.env["VITE_FIREBASE_API_KEY"] ?? "",
  authDomain: import.meta.env["VITE_FIREBASE_AUTH_DOMAIN"] ?? "",
  projectId: import.meta.env["VITE_FIREBASE_PROJECT_ID"] ?? "",
  storageBucket: import.meta.env["VITE_FIREBASE_STORAGE_BUCKET"] ?? "",
  messagingSenderId: import.meta.env["VITE_FIREBASE_MESSAGING_SENDER_ID"] ?? "",
  appId: import.meta.env["VITE_FIREBASE_APP_ID"] ?? "",
};

export const dataProvider: "local" | "firebase" = firebaseConfig.projectId ? "firebase" : "local";
