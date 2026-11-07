import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Receipt, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { PeriodFilter } from "@/components/fields";
import { useStore } from "@/lib/store";
import { usePeriod } from "@/lib/usePeriod";
import { brl, eventDRE, inPeriod, sum } from "@/lib/calc";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Dashboard — Rocket Gestão" },
    { name: "description", content: "Faturamento, custos, lucro e performance de eventos das casas Rocket." },
    { property: "og:title", content: "Dashboard — Rocket Gestão" },
    { property: "og:description", content: "Visão consolidada de Rocket Beach, Sea e Eventos." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Dashboard,
});

type Row = { date: string; company: string; kind: "Evento" | "Receita" | "Despesa" | "Investimento"; desc: string; revenue: number; cost: number; paid?: boolean };

function Dashboard() {
  const { db } = useStore();
  const p = usePeriod();
  const cname = (id: string) => db.companies.find((c) => c.id === id)?.short ?? id;

  const data = useMemo(() => {
    const evs = db.events.filter((e) => p.matchCompany(e.companyId) && inPeriod(e.date, p.month, p.year))
      .map((e) => ({ e, d: eventDRE(e, db.settings) }));
    const pays = db.payables.filter((x) => p.matchCompany(x.companyId) && inPeriod(x.due, p.month, p.year));
    const recs = db.receivables.filter((x) => p.matchCompany(x.companyId) && inPeriod(x.date, p.month, p.year));
    const revenue = sum(evs.map((x) => x.d.revenue)) + sum(recs.map((r) => r.value));
    const costs = sum(evs.map((x) => x.d.costs)) + sum(pays.map((x) => x.value));
    const pending = pays.filter((x) => !x.paid);
    const rows: Row[] = [
      ...evs.map(({ e, d }) => ({ date: e.date, company: cname(e.companyId), kind: "Evento" as const, desc: e.name, revenue: d.revenue, cost: d.costs })),
      ...recs.map((r) => ({ date: r.date, company: cname(r.companyId), kind: "Receita" as const, desc: r.client, revenue: r.value, cost: 0, paid: r.paid })),
      ...pays.map((x) => ({ date: x.due, company: cname(x.companyId), kind: x.type, desc: `${x.name} · ${x.category}`, revenue: 0, cost: x.value, paid: x.paid })),
    ].sort((a, b) => a.date.localeCompare(b.date));
    return { evs: [...evs].sort((a, b) => b.d.profit - a.d.profit), revenue, costs, profit: revenue - costs, pendingTotal: sum(pending.map((x) => x.value)), pendingCount: pending.length, rows };
  }, [db, p.month, p.year, p.company]); // eslint-disable-line react-hooks/exhaustive-deps

  const kpis = [
    { label: "Faturamento total", value: data.revenue, icon: DollarSign, tone: "" },
    { label: "Custos totais", value: data.costs, icon: Receipt, tone: "" },
    { label: "Lucro líquido", value: data.profit, icon: data.profit >= 0 ? TrendingUp : TrendingDown, tone: data.profit >= 0 ? "text-success" : "text-destructive" },
    { label: `A pagar pendente (${data.pendingCount})`, value: data.pendingTotal, icon: AlertCircle, tone: "text-primary" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Visão geral do período selecionado"><PeriodFilter {...p} /></PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{k.label}</span><k.icon className="size-4" /></div>
            <div className={cn("mt-2 font-display text-lg md:text-2xl font-bold tabular-nums", k.tone)}>{brl(k.value)}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <section className="lg:col-span-3 rounded-xl border bg-card p-4">
          <h2 className="font-semibold mb-3">Lucro por evento</h2>
          {data.evs.length === 0 ? <p className="text-sm text-muted-foreground py-10 text-center">Nenhum evento no período.</p> : (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={data.evs.map(({ e, d }) => ({ name: e.name, lucro: Math.round(d.profit) }))}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={40} />
                  <Tooltip formatter={(v: number) => brl(v)} />
                  <Bar dataKey="lucro" radius={[6, 6, 0, 0]}>
                    {data.evs.map(({ e, d }) => <Cell key={e.id} fill={d.profit >= 0 ? "var(--success)" : "var(--destructive)"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
        <section className="lg:col-span-2 rounded-xl border bg-card p-4">
          <h2 className="font-semibold mb-3">Ranking de eventos</h2>
          <ul className="divide-y">
            {data.evs.map(({ e, d }) => (
              <li key={e.id}>
                <Link to="/eventos/$id" params={{ id: e.id }} className={cn("flex items-center justify-between gap-2 py-2.5 px-2 -mx-2 rounded-md", d.profit < 0 && "bg-destructive/10")}>
                  <div className="min-w-0"><p className="font-medium truncate">{e.name}</p><p className="text-xs text-muted-foreground">{cname(e.companyId)} · {new Date(e.date + "T12:00").toLocaleDateString("pt-BR")}</p></div>
                  <div className="text-right">
                    <p className={cn("font-bold tabular-nums", d.profit < 0 ? "text-destructive" : "text-success")}>{brl(d.profit)}</p>
                    <p className="text-xs text-muted-foreground">{d.profit < 0 ? "Prejuízo" : `margem ${(d.margin * 100).toFixed(0)}%`}</p>
                  </div>
                </Link>
              </li>
            ))}
            {data.evs.length === 0 && <li className="text-sm text-muted-foreground py-4">—</li>}
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-xl border bg-card">
        <h2 className="font-semibold p-4 pb-2">Relatório geral do período</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground bg-muted"><tr>
              <th className="text-left p-2 pl-4">Data</th><th className="text-left p-2">Empresa</th><th className="text-left p-2">Tipo</th><th className="text-left p-2">Descrição</th>
              <th className="text-right p-2">Receita</th><th className="text-right p-2">Despesa</th><th className="text-right p-2">Resultado</th><th className="text-right p-2 pr-4">Margem</th>
            </tr></thead>
            <tbody>
              {data.rows.map((r, i) => { const res = r.revenue - r.cost; return (
                <tr key={i} className="border-t">
                  <td className="p-2 pl-4 whitespace-nowrap">{new Date(r.date + "T12:00").toLocaleDateString("pt-BR")}</td>
                  <td className="p-2">{r.company}</td><td className="p-2">{r.kind}{r.paid === false && <span className="ml-1 text-xs text-primary">(pend.)</span>}</td>
                  <td className="p-2 min-w-40">{r.desc}</td>
                  <td className="p-2 text-right tabular-nums">{r.revenue ? brl(r.revenue) : "—"}</td>
                  <td className="p-2 text-right tabular-nums">{r.cost ? brl(r.cost) : "—"}</td>
                  <td className={cn("p-2 text-right tabular-nums font-medium", res < 0 ? "text-destructive" : "text-success")}>{brl(res)}</td>
                  <td className="p-2 pr-4 text-right tabular-nums">{r.revenue ? `${((res / r.revenue) * 100).toFixed(0)}%` : "—"}</td>
                </tr>); })}
            </tbody>
            <tfoot className="border-t-2 font-bold"><tr>
              <td className="p-2 pl-4" colSpan={4}>Total</td><td className="p-2 text-right tabular-nums">{brl(data.revenue)}</td><td className="p-2 text-right tabular-nums">{brl(data.costs)}</td>
              <td className={cn("p-2 text-right tabular-nums", data.profit < 0 ? "text-destructive" : "text-success")}>{brl(data.profit)}</td>
              <td className="p-2 pr-4 text-right">{data.revenue ? `${((data.profit / data.revenue) * 100).toFixed(0)}%` : "—"}</td>
            </tr></tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
