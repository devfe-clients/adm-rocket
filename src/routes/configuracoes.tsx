import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { NoAccess, PageHeader } from "@/components/AppShell";
import { Num, Txt } from "@/components/fields";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/lib/store";
import { resetLocal } from "@/services/repository";
import { dataProvider } from "@/services/config";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({ meta: [
    { title: "Configurações — Rocket Gestão" }, { name: "description", content: "Modo de bar, comissões, empresas e categorias." },
    { property: "og:title", content: "Configurações — Rocket Gestão" }, { property: "og:description", content: "Ajustes do sistema Rocket." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { db, update, isDirector } = useStore();
  const [cat, setCat] = useState("");
  const [co, setCo] = useState("");
  const [rc, setRc] = useState("");
  if (!isDirector) return <NoAccess />;
  const s = db.settings;
  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader title="Configurações" />
      <Card title="Conferência de bar">
        <Row label="Contagem detalhada garrafa a garrafa" hint="Desligado = lançamento consolidado do custo do bar por evento.">
          <Switch checked={s.barMode === "detalhado"} onCheckedChange={(v) => update((d) => { d.settings.barMode = v ? "detalhado" : "consolidado"; })} />
        </Row>
      </Card>
      <Card title="Comissões de camarote">
        <Row label="Comissão percentual fixa por vendedor" hint="Desligado = valor negociado livremente em cada camarote.">
          <Switch checked={s.commissionMode === "percentual"} onCheckedChange={(v) => update((d) => { d.settings.commissionMode = v ? "percentual" : "livre"; })} />
        </Row>
        {s.commissionMode === "percentual" && <div className="mt-3 max-w-40"><span className="text-xs text-muted-foreground">Percentual (%)</span><Num value={s.commissionPct} onChange={(v) => update((d) => { d.settings.commissionPct = v; })} /></div>}
      </Card>
      <Card title="Empresas">
        <div className="space-y-2">{db.companies.map((c) => (
          <div key={c.id} className="grid grid-cols-[1fr_8rem] gap-2">
            <Txt value={c.name} onChange={(v) => update((d) => { d.companies.find((x) => x.id === c.id)!.name = v; })} />
            <Txt value={c.short} onChange={(v) => update((d) => { d.companies.find((x) => x.id === c.id)!.short = v; })} />
          </div>))}
          <div className="flex gap-2"><Txt value={co} onChange={setCo} /><Button disabled={!co.trim()} onClick={() => { update((d) => { d.companies.push({ id: co.toLowerCase().replace(/\W+/g, "-") + "-" + Date.now().toString(36), name: co, short: co }); d.users.filter((u) => u.role === "diretor").forEach((u) => u.companyIds.push(d.companies.at(-1)!.id)); }); setCo(""); }}><Plus /> Empresa</Button></div>
        </div>
      </Card>
      <Card title="Tipos de receita">
        <div className="flex flex-wrap gap-2 mb-3">{(s.revenueCategories ?? []).map((c) => (
          <span key={c} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm">{c}<button aria-label={`Remover ${c}`} onClick={() => update((d) => { d.settings.revenueCategories = (d.settings.revenueCategories ?? []).filter((x) => x !== c); })}><X className="size-3" /></button></span>))}</div>
        <div className="flex gap-2"><Txt value={rc} onChange={setRc} /><Button disabled={!rc.trim()} onClick={() => { update((d) => { (d.settings.revenueCategories ??= []).push(rc.trim()); }); setRc(""); }}><Plus /> Receita</Button></div>
      </Card>
      <Card title="Categorias de despesa">
        <div className="flex flex-wrap gap-2 mb-3">{s.categories.map((c) => (
          <span key={c} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm">{c}<button aria-label={`Remover ${c}`} onClick={() => update((d) => { d.settings.categories = d.settings.categories.filter((x) => x !== c); })}><X className="size-3" /></button></span>))}</div>
        <div className="flex gap-2"><Txt value={cat} onChange={setCat} /><Button disabled={!cat.trim()} onClick={() => { update((d) => { d.settings.categories.push(cat.trim()); }); setCat(""); }}><Plus /> Categoria</Button></div>
      </Card>
    </div>
  );
}

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => <section className="rounded-xl border bg-card p-4"><h2 className="font-semibold mb-3">{title}</h2>{children}</section>;
const Row = ({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) => <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{hint}</p></div>{children}</div>;
