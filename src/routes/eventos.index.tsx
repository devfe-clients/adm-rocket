import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { PeriodFilter } from "@/components/fields";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { usePeriod } from "@/lib/usePeriod";
import { brl, eventDRE, inPeriod } from "@/lib/calc";
import { uid } from "@/services/seed";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eventos/")({
  head: () => ({ meta: [
    { title: "Eventos — Rocket Gestão" }, { name: "description", content: "Fechamento de eventos: caixas, camarotes, custos, bar e DRE." },
    { property: "og:title", content: "Eventos — Rocket Gestão" }, { property: "og:description", content: "Fechamento de eventos Rocket." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: EventsPage,
});

function EventsPage() {
  const { db, update, visibleCompanies } = useStore();
  const p = usePeriod();
  const nav = useNavigate();
  const list = db.events.filter((e) => p.matchCompany(e.companyId) && inPeriod(e.date, p.month, p.year)).sort((a, b) => b.date.localeCompare(a.date));

  const create = () => {
    const id = uid();
    update((d) => { d.events.push({ id, companyId: p.company !== "all" ? p.company : visibleCompanies[0].id, name: "Novo evento", date: new Date().toISOString().slice(0, 10), partner: "", houseShare: 0.5, cashiers: [], boxes: [], costs: [], bar: [], courtesies: [], barConsolidated: 0 }); });
    nav({ to: "/eventos/$id", params: { id } });
  };

  return (
    <div>
      <PageHeader title="Eventos" subtitle="Gestão e fechamento"><PeriodFilter {...p} /><Button onClick={create} className="w-full md:w-auto"><Plus /> Novo evento</Button></PageHeader>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((e) => { const d = eventDRE(e, db.settings); return (
          <Link key={e.id} to="/eventos/$id" params={{ id: e.id }} className={cn("rounded-xl border bg-card p-4 hover:border-primary transition-colors", d.profit < 0 && "border-destructive/50")}>
            <div className="flex justify-between text-xs text-muted-foreground"><span>{db.companies.find((c) => c.id === e.companyId)?.name}</span><span>{new Date(e.date + "T12:00").toLocaleDateString("pt-BR")}</span></div>
            <h3 className="mt-1 text-lg font-bold">{e.name}</h3>
            <p className="text-xs text-muted-foreground">{e.partner || "Sem parceiro"}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div><p className="text-muted-foreground">Receita</p><p className="font-semibold tabular-nums">{brl(d.revenue)}</p></div>
              <div><p className="text-muted-foreground">Custos</p><p className="font-semibold tabular-nums">{brl(d.costs)}</p></div>
              <div><p className="text-muted-foreground">Lucro</p><p className={cn("font-bold tabular-nums", d.profit < 0 ? "text-destructive" : "text-success")}>{brl(d.profit)}</p></div>
            </div>
          </Link>); })}
        {list.length === 0 && <p className="text-muted-foreground">Nenhum evento no período.</p>}
      </div>
    </div>
  );
}
