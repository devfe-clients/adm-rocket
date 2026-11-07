import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { NoAccess, PageHeader } from "@/components/AppShell";
import { Sel, Txt } from "@/components/fields";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { uid } from "@/services/seed";
import { cn } from "@/lib/utils";

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
  if (!isDirector) return <NoAccess />;
  return (
    <div className="max-w-4xl">
      <PageHeader title="Usuários e permissões" subtitle="Diretores veem tudo. Gerentes/Operadores lançam apenas nas empresas marcadas." />
      <div className="space-y-3">
        {db.users.map((u) => {
          const s = (fn: (x: typeof u) => void) => update((d) => { const x = d.users.find((y) => y.id === u.id); if (x) fn(x); });
          return (
            <div key={u.id} className="rounded-xl border bg-card p-4 grid gap-3 md:grid-cols-[1fr_1fr_10rem_auto] items-center">
              <Txt value={u.name} onChange={(v) => s((x) => { x.name = v; })} />
              <Txt value={u.email} onChange={(v) => s((x) => { x.email = v; })} />
              <Sel value={u.role} onChange={(v) => s((x) => { x.role = v; })} options={[{ value: "diretor", label: "Diretor" }, { value: "gerente", label: "Gerente/Operador" }]} />
              <button disabled={u.id === db.currentUserId} onClick={() => update((d) => { d.users = d.users.filter((y) => y.id !== u.id); })} className="p-2 text-muted-foreground hover:text-destructive disabled:opacity-30" aria-label="Remover"><Trash2 className="size-4" /></button>
              {u.role === "gerente" && <div className="md:col-span-4 flex flex-wrap gap-2">{db.companies.map((c) => { const on = u.companyIds.includes(c.id); return (
                <button key={c.id} onClick={() => s((x) => { x.companyIds = on ? x.companyIds.filter((i) => i !== c.id) : [...x.companyIds, c.id]; })}
                  className={cn("rounded-full px-3 py-1.5 text-sm border", on ? "bg-primary text-primary-foreground border-primary" : "bg-background")}>{c.name}</button>); })}</div>}
            </div>
          );
        })}
      </div>
      <Button className="mt-4" onClick={() => update((d) => { d.users.push({ id: uid(), name: "Novo usuário", email: "", role: "gerente", companyIds: [] }); })}><Plus /> Adicionar usuário</Button>
    </div>
  );
}
