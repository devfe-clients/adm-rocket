import { z } from "zod";

export const userSaveSchema = z.object({
  token: z.string().min(1),
  users: z.array(z.object({
    id: z.string().min(1).max(100),
    name: z.string().trim().min(1, "Preencha o nome.").max(200),
    email: z.string().trim().email("Preencha um e-mail válido.").transform(v => v.toLowerCase()),
    role: z.enum(["diretor", "gerente"]),
    companyIds: z.array(z.string().min(1)).max(100),
    password: z.string().max(128).optional(),
  })).min(1).max(100),
}).superRefine(({ users }, ctx) => {
  const emails = new Set<string>();
  const ids = new Set<string>();
  users.forEach((u, i) => {
    if (emails.has(u.email) || ids.has(u.id)) ctx.addIssue({ code: "custom", path: ["users", i], message: "Há usuários duplicados." });
    emails.add(u.email); ids.add(u.id);
    if (u.password && u.password.length < 6) ctx.addIssue({ code: "custom", path: ["users", i, "password"], message: "A senha precisa ter pelo menos 6 caracteres." });
  });
});

export function isTrustedDirector(email: string, claims: Record<string, unknown>, bootstrap: string[]) {
  return claims["rocketDirector"] === true || bootstrap.includes(email.toLowerCase());
}

export type UserSaveInput = z.infer<typeof userSaveSchema>;