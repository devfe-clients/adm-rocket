import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Mail, AlertCircle, Eye, EyeOff } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { toast } from "sonner";
import { NoAccess, PageHeader } from "@/components/AppShell";
import { Sel, Txt } from "@/components/fields";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { auth } from "@/services/firebase";
import { uid } from "@/services/seed";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/lib/types";
import { saveUserAccounts } from "@/services/users.functions";

export const Route = createFileRoute("/usuarios")({
  head: () => ({ meta: [
    { title: "Usuários e permissões — Rocket Gestão" }, { name: "description", content: "Diretores e gerentes/operadores por empresa." },
    { property: "og:title", content: "Usuários — Rocket Gestão" }, { property: "og:description", content: "Níveis de acesso do sistema Rocket." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: UsersPage,
});

function UsersPage() {
  const { db, update, isDirector } = useStore();
  const [userList, setUserList] = useState<AppUser[]>(db.users);
  const [isSaving, setIsSaving] = useState(false);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const [originalIds] = useState<Set<string>>(() => new Set(db.users.map((u) => u.id)));

  useEffect(() => {
    setUserList(db.users);
  }, [db.users]);

  if (!isDirector) return <NoAccess />;

  const handleSave = async () => {

    for (const u of userList) {
      const pwd = passwords[u.id] ?? "";
      const isNew = !originalIds.has(u.id);
      if (isNew && pwd.length < 6) {
        toast.error(`Preencha a senha inicial de "${u.name || u.email}" (mín. 6 caracteres).`);
        return;
      }
      if (!isNew && pwd.length > 0 && pwd.length < 6) {
        toast.error(`A nova senha de "${u.name || u.email}" precisa ter ao menos 6 caracteres.`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }

      const payload = userList.map((u) => {
        const pwd = passwords[u.id] ?? "";
        return pwd.length >= 6 ? { ...u, password: pwd } : u;
      });

      const updatedUsers = await saveUserAccounts({
        data: { token, users: payload },
      });

      update((d) => { d.users = updatedUsers; });
      setPasswords({});
      toast.success("Usuários e senhas salvos com sucesso!");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar usuários.";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendReset = async (email: string, id: string) => {
    if (!email || !email.includes("@")) {
      toast.error("Preencha um e-mail válido primeiro.");
      return;
    }
    setSendingEmailId(id);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(`E-mail enviado para ${email} com link para criar/redefinir senha!`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao enviar e-mail";
      toast.error(`Falha: ${msg}. Verifique se o e-mail já existe no Firebase Auth.`);
    } finally {
      setSendingEmailId(null);
    }
  };

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <PageHeader
          title="Usuários e permissões"
          subtitle="Diretores veem tudo. Gerentes/Operadores lançam apenas nas empresas marcadas."
        />
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground flex items-start gap-2">
        <AlertCircle className="size-4 text-primary mt-0.5 shrink-0" />
        <span>Novos usuários precisam de uma senha inicial. Usuários existentes: deixe o campo de senha em branco para não alterar.</span>
      </div>

      <div className="space-y-3">
        {userList.map((u) => {
          const updateUser = (patch: Partial<AppUser>) => {
            setUserList((prev) => prev.map((item) => (item.id === u.id ? { ...item, ...patch } : item)));
          };

          return (
            <div key={u.id} className="rounded-xl border bg-card p-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-[1fr_1.2fr_10rem_auto_auto] items-center">
              <Txt
                value={u.name}
                onChange={(v) => updateUser({ name: v })}
              />
              <Txt
                value={u.email}
                onChange={(v) => updateUser({ email: v })}
              />
              <Sel
                value={u.role}
                onChange={(v) => updateUser({ role: v as "diretor" | "gerente" })}
                options={[
                  { value: "diretor", label: "Diretor" },
                  { value: "gerente", label: "Gerente/Operador" },
                ]}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                title="Enviar link para criar ou redefinir senha por e-mail"
                disabled={sendingEmailId === u.id || !u.email}
                onClick={() => handleSendReset(u.email, u.id)}
                className="gap-1.5 text-xs whitespace-nowrap"
              >
                <Mail className="size-3.5" />
                {sendingEmailId === u.id ? "Enviando..." : "Link de senha"}
              </Button>
              <button
                type="button"
                disabled={u.id === db.currentUserId}
                onClick={() => setUserList((prev) => prev.filter((item) => item.id !== u.id))}
                className="p-2 text-muted-foreground hover:text-destructive disabled:opacity-30"
                aria-label="Remover"
              >
                <Trash2 className="size-4" />
              </button>
            </div>

            <div className="relative">
              <input
                type={showPasswords[u.id] ? "text" : "password"}
                value={passwords[u.id] ?? ""}
                onChange={(e) =>
                  setPasswords((prev) => ({ ...prev, [u.id]: e.target.value }))
                }
                placeholder={
                  originalIds.has(u.id)
                    ? "Nova senha (deixe em branco para manter)"
                    : "Senha inicial (mín. 6 caracteres) *"
                }
                autoComplete="new-password"
                className={cn(
                  "w-full rounded-lg border bg-background px-3 py-2 pr-9 text-sm outline-none",
                  "focus:ring-2 focus:ring-primary/40 transition",
                  !originalIds.has(u.id) && (passwords[u.id] ?? "").length === 0
                    ? "border-amber-400/60 placeholder:text-amber-600/70"
                    : "border-border"
                )}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() =>
                  setShowPasswords((prev) => ({ ...prev, [u.id]: !prev[u.id] }))
                }
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPasswords[u.id]
                  ? <EyeOff className="size-4" />
                  : <Eye className="size-4" />}
              </button>
            </div>

              {u.role === "gerente" && (
                <div className="flex flex-wrap gap-2 pt-1 border-t border-border/50">
                  <span className="text-xs text-muted-foreground self-center mr-1">Casas autorizadas:</span>
                  {db.companies.map((c) => {
                    const on = u.companyIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          const next = on
                            ? u.companyIds.filter((i) => i !== c.id)
                            : [...u.companyIds, c.id];
                          updateUser({ companyIds: next });
                        }}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs border transition-colors",
                          on
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground"
                        )}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          onClick={() =>
            setUserList((prev) => [
              ...prev,
              { id: uid(), name: "", email: "", role: "gerente", companyIds: [] },
            ])
          }
          className="gap-1.5"
        >
          <Plus className="size-4" /> Adicionar usuário
        </Button>

        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="size-4" />
          {isSaving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </div>
  );
}
