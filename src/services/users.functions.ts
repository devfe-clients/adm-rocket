import { createServerFn } from "@tanstack/react-start";
import { userSaveSchema } from "./user-management";

export const saveUserAccounts = createServerFn({ method: "POST" })
  .inputValidator(input => userSaveSchema.parse(input))
  .handler(async ({ data }) => {
    const credentials = process.env["FIREBASE_SERVICE_ACCOUNT"];
    const bootstrap = process.env["FIREBASE_BOOTSTRAP_DIRECTORS"];
    if (!credentials || !bootstrap) throw new Error("O cadastro de usuários ainda precisa da configuração administrativa do Firebase.");
    const { saveFirebaseUsers } = await import("./firebase-admin.server");
    return saveFirebaseUsers(data, credentials, bootstrap);
  });