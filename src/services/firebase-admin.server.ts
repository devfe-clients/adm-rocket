import { createRemoteJWKSet, importPKCS8, jwtVerify, SignJWT } from "jose";
import type { AppUser } from "@/lib/types";
import { isTrustedDirector, type UserSaveInput } from "./user-management";

type Credentials = { project_id: string; client_email: string; private_key: string };
type Account = { localId: string; email: string; customAttributes?: string; disabled?: boolean };
const firebaseKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));

async function request(url: string, token: string, body?: unknown) {
  const response = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    // Never include provider bodies: they can contain credential or password data.
    throw new Error(`Firebase recusou a operação (${response.status}). Confira as permissões administrativas e tente novamente.`);
  }
  return response.json();
}

export async function saveFirebaseUsers(input: UserSaveInput, rawCredentials: string, bootstrapRaw: string) {
  const credentials = JSON.parse(rawCredentials) as Credentials;
  if (!credentials.project_id || !credentials.client_email || !credentials.private_key) throw new Error("Credencial administrativa do Firebase inválida.");
  const project = credentials.project_id;
  const { payload } = await jwtVerify(input.token, firebaseKeys, {
    issuer: `https://securetoken.google.com/${project}`, audience: project, algorithms: ["RS256"],
  });
  const callerEmail = typeof payload["email"] === "string" ? payload["email"].toLowerCase() : "";
  const bootstrap = bootstrapRaw.split(",").map(v => v.trim().toLowerCase()).filter(Boolean);
  if (!payload.sub || !callerEmail || !isTrustedDirector(callerEmail, payload, bootstrap)) throw new Error("Somente diretores autorizados podem salvar usuários.");
  const self = input.users.find(u => u.email === callerEmail);
  if (!self || self.role !== "diretor") throw new Error("Você não pode remover ou rebaixar seu próprio acesso.");

  const key = await importPKCS8(credentials.private_key, "RS256");
  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/datastore" })
    .setProtectedHeader({ alg: "RS256" }).setIssuer(credentials.client_email).setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt().setExpirationTime("5m").sign(key);
  const exchange = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }) });
  if (!exchange.ok) throw new Error("Não foi possível autenticar a administração do Firebase.");
  const oauth = await exchange.json() as { access_token?: string };
  if (!oauth.access_token) throw new Error("Não foi possível autenticar a administração do Firebase.");
  const accessToken = oauth.access_token;
  const base = `https://identitytoolkit.googleapis.com/v1/projects/${project}`;
  const callerLookup = await request(`${base}/accounts:lookup`, accessToken, { localId: [payload.sub] }) as { users?: Account[] };
  const caller = callerLookup.users?.[0];
  if (!caller || caller.disabled) throw new Error("Sua conta não está ativa.");
  const liveClaims = JSON.parse(caller.customAttributes || "{}") as Record<string, unknown>;
  if (!isTrustedDirector(callerEmail, liveClaims, bootstrap)) throw new Error("Seu acesso administrativo foi revogado.");

  const documents = `projects/${project}/databases/(default)/documents`;
  const dbUrl = `https://firestore.googleapis.com/v1/${documents}/rocket-gestao/db-v1`;
  const stored = await request(dbUrl, accessToken) as { fields?: Record<string, any>; updateTime?: string };
  const oldUsers: AppUser[] = (stored.fields?.["users"]?.arrayValue?.values ?? []).map((v: any) => {
    const f = v.mapValue.fields;
    return { id: f.id.stringValue, email: f.email.stringValue, name: f.name.stringValue, role: f.role.stringValue, companyIds: (f.companyIds?.arrayValue?.values ?? []).map((x: any) => x.stringValue) };
  });
  const companyIds = new Set<string>((stored.fields?.["companies"]?.arrayValue?.values ?? []).map((v: any) => v.mapValue.fields.id.stringValue));
  // Validate the entire batch before creating accounts or changing passwords.
  const accounts = new Map<string, Account | undefined>();
  for (const u of input.users) {
    const previous = oldUsers.find(old => old.id === u.id);
    if (previous && previous.email.toLowerCase() !== u.email) throw new Error("O e-mail de usuários existentes não pode ser alterado nesta tela.");
    if (u.companyIds.some(id => !companyIds.has(id))) throw new Error("Há uma empresa inválida nas permissões.");
    const lookup = await request(`${base}/accounts:lookup`, accessToken, { email: [u.email] }) as { users?: Account[] };
    const account = lookup.users?.[0];
    if (!account && !u.password) throw new Error(`Preencha a senha inicial de ${u.name}.`);
    accounts.set(u.email, account);
  }
  const users: AppUser[] = input.users.map(({ password: _password, ...profile }) => profile);
  for (const u of input.users) {
    let account = accounts.get(u.email);
    if (!account) {
      account = await request(`${base}/accounts`, accessToken, { email: u.email, password: u.password, displayName: u.name, emailVerified: false }) as Account;
    }
    if (!account.localId) throw new Error("Não foi possível criar a conta. Tente salvar novamente.");
    const claims = JSON.parse(account.customAttributes || "{}");
    await request(`${base}/accounts:update`, accessToken, {
      localId: account.localId, displayName: u.name, disableUser: false,
      customAttributes: JSON.stringify({ ...claims, rocketDirector: u.role === "diretor" }),
      ...(u.password ? { password: u.password, validSince: String(Math.floor(Date.now() / 1000)) } : {}),
    });
  }
  const removed = oldUsers.filter(old => !users.some(u => u.id === old.id));
  for (const u of removed) {
    const lookup = await request(`${base}/accounts:lookup`, accessToken, { email: [u.email] }) as { users?: Account[] };
    const account = lookup.users?.[0];
    if (account) await request(`${base}/accounts:update`, accessToken, { localId: account.localId, disableUser: true, validSince: String(Math.floor(Date.now() / 1000)), customAttributes: JSON.stringify({ ...JSON.parse(account.customAttributes || "{}"), rocketDirector: false }) });
  }
  const encode = (value: unknown): any => {
    if (typeof value === "string") return { stringValue: value };
    if (Array.isArray(value)) return { arrayValue: { values: value.map(encode) } };
    if (value && typeof value === "object") return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encode(v)])) } };
    throw new Error("Perfil inválido.");
  };
  await request(`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents:commit`, accessToken, { writes: [
    { update: { name: `${documents}/rocket-gestao/db-v1`, fields: { users: encode(users) } }, updateMask: { fieldPaths: ["users"] }, ...(stored.updateTime ? { currentDocument: { updateTime: stored.updateTime } } : {}) },
    ...users.map(u => ({ update: { name: `${documents}/authorized-emails/${u.email}`, fields: { role: encode(u.role) } }, updateMask: { fieldPaths: ["role"] } })),
    ...removed.map(u => ({ delete: `${documents}/authorized-emails/${u.email.toLowerCase()}` })),
  ] });
  return users;
}