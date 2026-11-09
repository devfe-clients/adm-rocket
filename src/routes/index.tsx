import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
  PieChart, Pie, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Receipt, AlertCircle,
  Ticket, Wine, LayoutGrid,
} from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { PeriodFilter } from "@/components/fields";
import { useStore } from "@/lib/store";
import { usePeriod } from "@/lib/usePeriod";
import { useIsMobile } from "@/hooks/use-mobile";
import { brl, eventDRE, inPeriod, sum } from "@/lib/calc";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Rocket Gestão" },
      { name: "description", content: "Faturamento, custos, lucro e performance de eventos das casas Rocket." },
      { property: "og:title", content: "Dashboard — Rocket Gestão" },
      { property: "og:description", content: "Visão consolidada de Rocket Beach, Sea e Eventos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

type Row = {
  date: string; company: string;
  kind: "Evento" | "Receita" | "Despesa" | "Investimento";
  desc: string; revenue: number; cost: number; paid?: boolean;
};

const DarkTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color?: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/40 bg-popover px-3 py-2 shadow-xl text-xs">
      {label && <p className="font-semibold text-foreground mb-1.5 max-w-[180px] truncate">{label}</p>}
      {payload.map((p, i) => {
        const isProfitField = p.name.toLowerCase().includes("lucro");
        const isDeficit = isProfitField && p.value < 0;
        const isZero = isProfitField && p.value === 0;

        const displayName = isDeficit ? "Déficit" : isZero ? "Sem lucro" : p.name;
        const dotColor = isDeficit
          ? "var(--destructive)"
          : isProfitField
          ? "var(--success)"
          : (p.color ?? "var(--primary)");

        return (
          <div key={i} className="flex items-center gap-2 py-0.5">
            <span className="size-2 rounded-full inline-block shrink-0" style={{ background: dotColor }} />
            <span className="text-muted-foreground">{displayName}:</span>
            <span className={cn("font-medium tabular-nums", isDeficit ? "text-destructive font-semibold" : isProfitField && p.value > 0 ? "text-success" : "text-foreground")}>
              {brl(p.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const KindBadge = ({ kind }: { kind: Row["kind"] }) => {
  const map = {
    Evento:       "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    Receita:      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    Despesa:      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    Investimento: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", map[kind])}>
      {kind}
    </span>
  );
};

function Dashboard() {
  const isMobile = useIsMobile();
  const { db } = useStore();
  const p = usePeriod();
  const cname = (id: string) => db.companies.find((c) => c.id === id)?.short ?? id;
  const [eventView, setEventView] = useState<"top10" | "deficit" | "all">("top10");

  const data = useMemo(() => {
    const evs = db.events
      .filter((e) => p.matchCompany(e.companyId) && inPeriod(e.date, p.month, p.year))
      .map((e) => ({ e, d: eventDRE(e, db.settings) }));

    const pays  = db.payables.filter((x) => p.matchCompany(x.companyId) && inPeriod(x.due,  p.month, p.year));
    const recs  = db.receivables.filter((x) => p.matchCompany(x.companyId) && inPeriod(x.date, p.month, p.year));

    const revenue = sum(evs.map((x) => x.d.revenue)) + sum(recs.map((r) => r.value));
    const costs   = sum(evs.map((x) => x.d.costs))   + sum(pays.map((x) => x.value));
    const profit  = revenue - costs;
    const margin  = revenue ? profit / revenue : 0;
    const totalLosses = sum(evs.map((x) => x.d.losses));

    const pending     = pays.filter((x) => !x.paid);
    const pendingTotal = sum(pending.map((x) => x.value));

    const cashierRev   = sum(evs.map((x) => x.d.cashiers));
    const boxRev       = sum(evs.map((x) => x.d.boxes));
    const otherRev     = sum(recs.map((r) => r.value));

    const houseMap: Record<string, { rev: number; profit: number; name: string }> = {};
    for (const co of db.companies) {
      if (!p.matchCompany(co.id)) continue;
      const hEvs  = db.events.filter((e) => e.companyId === co.id && inPeriod(e.date, p.month, p.year));
      const hPays = db.payables.filter((x) => x.companyId === co.id && inPeriod(x.due, p.month, p.year));
      const hRecs = db.receivables.filter((x) => x.companyId === co.id && inPeriod(x.date, p.month, p.year));
      const hDREs = hEvs.map((e) => eventDRE(e, db.settings));
      const hRev  = sum(hDREs.map((d) => d.revenue)) + sum(hRecs.map((r) => r.value));
      const hCost = sum(hDREs.map((d) => d.costs)) + sum(hPays.map((x) => x.value));
      houseMap[co.id] = { name: co.short, rev: hRev, profit: hRev - hCost };
    }
    const houseChart = Object.values(houseMap).filter((h) => h.rev > 0 || Math.abs(h.profit) > 0);

    const catMap: Record<string, number> = {};
    for (const { e } of evs) {
      for (const c of e.costs) catMap[c.category] = (catMap[c.category] ?? 0) + c.value;
    }
    for (const p2 of pays) catMap[p2.category] = (catMap[p2.category] ?? 0) + p2.value;
    const costPie = Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const rows: Row[] = [
      ...evs.map(({ e, d }) => ({ date: e.date, company: cname(e.companyId), kind: "Evento" as const, desc: e.name, revenue: d.revenue, cost: d.costs })),
      ...recs.map((r)       => ({ date: r.date, company: cname(r.companyId), kind: "Receita" as const, desc: r.client, revenue: r.value, cost: 0, paid: r.paid })),
      ...pays.map((x)       => ({ date: x.due,  company: cname(x.companyId), kind: x.type as "Despesa" | "Investimento", desc: `${x.name} · ${x.category}`, revenue: 0, cost: x.value, paid: x.paid })),
    ].sort((a, b) => a.date.localeCompare(b.date));

    return {
      evs: [...evs].sort((a, b) => b.d.profit - a.d.profit),
      revenue, costs, profit, margin, totalLosses,
      pendingTotal, pendingCount: pending.length,
      cashierRev, boxRev, otherRev,
      houseChart, costPie, rows,
    };
  }, [db, p.month, p.year, p.company]);

  const deficitCount = useMemo(() => data.evs.filter((x) => x.d.profit < 0).length, [data.evs]);

  const chartEvents = useMemo(() => {
    if (eventView === "deficit") {
      return data.evs.filter((x) => x.d.profit < 0);
    }
    if (eventView === "top10") {
      return data.evs.slice(0, 10);
    }
    return data.evs;
  }, [data.evs, eventView]);

  const PIE_COLORS = ["#e8521a", "#f97316", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa", "#f472b6"];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Visão geral do período selecionado">
        <PeriodFilter {...p} />
      </PageHeader>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Faturamento total</span><DollarSign className="size-4" />
          </div>
          <p className="font-display text-xl md:text-2xl font-bold tabular-nums">{brl(data.revenue)}</p>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Custos totais</span><Receipt className="size-4" />
          </div>
          <p className="font-display text-xl md:text-2xl font-bold tabular-nums">{brl(data.costs)}</p>
        </div>

        <div className={cn("rounded-xl border bg-card p-4 space-y-2", data.profit < 0 && "border-destructive/30 bg-destructive/5")}>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{data.profit < 0 ? "Déficit líquido" : data.profit === 0 ? "Sem lucro" : "Lucro líquido"}</span>
            {data.profit >= 0 ? <TrendingUp className="size-4 text-success" /> : <TrendingDown className="size-4 text-destructive" />}
          </div>
          <p className={cn("font-display text-xl md:text-2xl font-bold tabular-nums", data.profit >= 0 ? "text-success" : "text-destructive")}>
            {brl(data.profit)}
          </p>
          <span className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
            data.margin >= 0
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
              : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
          )}>
            {data.revenue ? `Margem ${(data.margin * 100).toFixed(1)}%` : "—"}
          </span>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>A pagar pendente ({data.pendingCount})</span><AlertCircle className="size-4 text-primary" />
          </div>
          <p className="font-display text-xl md:text-2xl font-bold tabular-nums text-primary">{brl(data.pendingTotal)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4 col-span-2 md:col-span-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <LayoutGrid className="size-3.5" /><span>Composição da receita</span>
          </div>
          <div className="space-y-2.5">
            {[
              { label: "Bilheteria / Caixas", value: data.cashierRev, icon: Ticket },
              { label: "Camarotes",           value: data.boxRev,     icon: Wine },
              { label: "Outros recebíveis",   value: data.otherRev,   icon: DollarSign },
            ].map(({ label, value, icon: Icon }) => {
              const pct = data.revenue ? (value / data.revenue) * 100 : 0;
              return (
                <div key={label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1 text-muted-foreground"><Icon className="size-3" />{label}</span>
                    <span className="font-medium tabular-nums">{brl(value)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={cn(
          "rounded-xl border bg-card p-4 flex flex-col justify-between",
          data.totalLosses > 0 && "border-amber-300/50 bg-amber-50/50 dark:bg-amber-900/10"
        )}>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Furo / Quebra de Bar</span>
            <Wine className={cn("size-4", data.totalLosses > 0 ? "text-amber-500" : "text-muted-foreground")} />
          </div>
          <p className={cn("font-display text-xl md:text-2xl font-bold tabular-nums", data.totalLosses > 0 ? "text-amber-600 dark:text-amber-400" : "text-success")}>
            {brl(data.totalLosses)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {data.totalLosses > 0 ? "Perdas de estoque não vendido detectadas." : "Nenhuma perda no período."}
          </p>
        </div>

        <div className={cn("rounded-xl border bg-card p-4", data.pendingCount > 0 && "border-primary/30")}>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Contas críticas</span><AlertCircle className={cn("size-4", data.pendingCount > 0 ? "text-primary" : "text-muted-foreground")} />
          </div>
          <p className="font-display text-xl md:text-2xl font-bold tabular-nums text-primary">{data.pendingCount}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {data.pendingCount > 0 ? `${brl(data.pendingTotal)} em aberto` : "Nenhuma pendência."}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="lg:col-span-3 rounded-xl border bg-card p-4 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="font-semibold text-sm">Lucro por evento</h2>
              <p className="text-[11px] text-muted-foreground">
                {eventView === "top10" && `Exibindo os ${Math.min(10, data.evs.length)} mais lucrativos`}
                {eventView === "deficit" && `${deficitCount} ${deficitCount === 1 ? "evento com prejuízo" : "eventos com prejuízo"}`}
                {eventView === "all" && `Todos os ${data.evs.length} eventos`}
              </p>
            </div>
            {data.evs.length > 0 && (
              <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-1 text-xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setEventView("top10")}
                  className={cn(
                    "rounded-md px-2.5 py-1 font-medium transition-colors",
                    eventView === "top10" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Top 10
                </button>
                <button
                  type="button"
                  onClick={() => setEventView("deficit")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors",
                    eventView === "deficit" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                    deficitCount > 0 && eventView !== "deficit" && "text-destructive"
                  )}
                >
                  Prejuízos
                  {deficitCount > 0 && (
                    <span className="rounded-full bg-destructive/15 text-destructive px-1.5 py-0.2 text-[10px] font-bold">
                      {deficitCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEventView("all")}
                  className={cn(
                    "rounded-md px-2.5 py-1 font-medium transition-colors",
                    eventView === "all" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Todos ({data.evs.length})
                </button>
              </div>
            )}
          </div>

          {data.evs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">Nenhum evento no período.</p>
          ) : eventView === "deficit" && chartEvents.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center p-4">
              <p className="text-sm font-semibold text-success">Nenhum evento com prejuízo!</p>
              <p className="text-xs text-muted-foreground mt-1">Todos os {data.evs.length} eventos fecharam com resultado positivo ou zerados.</p>
            </div>
          ) : (
            <div className={cn("overflow-x-auto", isMobile ? "h-72" : "h-56")}>
              <div
                className="h-full"
                style={{
                  minWidth: (isMobile || chartEvents.length > 8)
                    ? `${Math.max(chartEvents.length * (isMobile ? 65 : 55), isMobile ? 480 : 0)}px`
                    : "100%",
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartEvents.map(({ e, d }) => ({ name: e.name, Lucro: Math.round(d.profit) }))}
                    margin={{ top: 4, right: 8, bottom: isMobile ? 40 : 4, left: 0 }}
                  >
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      interval={0}
                      axisLine={false}
                      tickLine={false}
                      angle={isMobile ? -45 : 0}
                      textAnchor={isMobile ? "end" : "middle"}
                      height={isMobile ? 65 : 24}
                    />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} width={36} axisLine={false} tickLine={false} />
                    <Tooltip content={<DarkTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                    <Bar dataKey="Lucro" radius={[6, 6, 0, 0]} maxBarSize={56}>
                      {chartEvents.map(({ e, d }) => (
                        <Cell key={e.id} fill={d.profit >= 0 ? "var(--success)" : "var(--destructive)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </section>

        <section className="lg:col-span-2 rounded-xl border bg-card p-4">
          <h2 className="font-semibold text-sm mb-3">Ranking de eventos</h2>
          <ul className="divide-y">
            {data.evs.map(({ e, d }) => (
              <li key={e.id}>
                <Link
                  to="/eventos/$id"
                  params={{ id: e.id }}
                  className="flex items-center justify-between gap-2 py-2.5 px-2 -mx-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{e.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cname(e.companyId)} · {new Date(e.date + "T12:00").toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn("font-bold tabular-nums text-sm", d.profit < 0 ? "text-destructive" : "text-success")}>
                      {brl(d.profit)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {d.profit < 0 ? "Prejuízo" : `margem ${(d.margin * 100).toFixed(0)}%`}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
            {data.evs.length === 0 && <li className="text-sm text-muted-foreground py-4">—</li>}
          </ul>
        </section>
      </div>

      {(data.houseChart.length > 0 || data.costPie.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.houseChart.length > 0 && (
            <section className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-sm">Comparativo por casa</h2>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-primary" /> Faturamento
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-success" /> Lucro
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-destructive" /> Déficit
                  </span>
                </div>
              </div>
              <div className="h-52">
                <ResponsiveContainer>
                  <BarChart
                    data={data.houseChart}
                    margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
                    barGap={4}
                    barCategoryGap="30%"
                  >
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} width={36} axisLine={false} tickLine={false} />
                    <Tooltip content={<DarkTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                    <Bar dataKey="rev" name="Faturamento" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="profit" name="Lucro" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {data.houseChart.map((h, i) => (
                        <Cell key={i} fill={h.profit >= 0 ? "var(--success)" : "var(--destructive)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {data.costPie.length > 0 && (
            <section className="rounded-xl border bg-card p-4">
              <h2 className="font-semibold text-sm mb-4">Composição de custos</h2>
              <div className="h-52">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={data.costPie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="52%"
                      outerRadius="78%"
                      paddingAngle={3}
                    >
                      {data.costPie.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => brl(v)}
                      contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11 }}
                      formatter={(value: any, entry: any) => {
                        const pct = data.costs ? (((entry?.payload?.value ?? 0) / data.costs) * 100).toFixed(0) : "0";
                        return `${value} (${pct}%)`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}
        </div>
      )}

      <section className="rounded-xl border bg-card">
        <h2 className="font-semibold text-sm p-4 pb-2">Relatório geral do período</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground bg-muted/60">
              <tr>
                <th className="text-left p-2 pl-4 font-medium">Data</th>
                <th className="text-left p-2 font-medium">Empresa</th>
                <th className="text-left p-2 font-medium">Tipo</th>
                <th className="text-left p-2 font-medium">Descrição</th>
                <th className="text-right p-2 font-medium">Receita</th>
                <th className="text-right p-2 font-medium">Despesa</th>
                <th className="text-right p-2 font-medium">Resultado</th>
                <th className="text-right p-2 pr-4 font-medium">Margem</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r, i) => {
                const res = r.revenue - r.cost;
                return (
                  <tr key={i} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="p-2 pl-4 whitespace-nowrap text-muted-foreground">
                      {new Date(r.date + "T12:00").toLocaleDateString("pt-BR")}
                    </td>
                    <td className="p-2 text-muted-foreground">{r.company}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <KindBadge kind={r.kind} />
                        {r.paid === false && (
                          <span className="rounded-full bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-semibold">
                            pend.
                          </span>
                        )}
                        {r.paid === true && (
                          <span className="rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-1.5 py-0.5 text-[10px] font-semibold">
                            pago
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2 min-w-36 max-w-[200px] truncate">{r.desc}</td>
                    <td className="p-2 text-right tabular-nums text-muted-foreground">
                      {r.revenue ? brl(r.revenue) : "—"}
                    </td>
                    <td className="p-2 text-right tabular-nums text-muted-foreground">
                      {r.cost ? brl(r.cost) : "—"}
                    </td>
                    <td className={cn("p-2 text-right tabular-nums font-semibold", res < 0 ? "text-destructive" : "text-success")}>
                      {brl(res)}
                    </td>
                    <td className="p-2 pr-4 text-right tabular-nums text-muted-foreground">
                      {r.revenue ? `${((res / r.revenue) * 100).toFixed(0)}%` : "—"}
                    </td>
                  </tr>
                );
              })}
              {data.rows.length === 0 && (
                <tr><td colSpan={8} className="p-6 text-center text-sm text-muted-foreground">Nenhum lançamento no período.</td></tr>
              )}
            </tbody>
            <tfoot className="border-t-2 font-bold text-sm bg-muted/40">
              <tr>
                <td className="p-2 pl-4" colSpan={4}>Total do período</td>
                <td className="p-2 text-right tabular-nums">{brl(data.revenue)}</td>
                <td className="p-2 text-right tabular-nums">{brl(data.costs)}</td>
                <td className={cn("p-2 text-right tabular-nums", data.profit < 0 ? "text-destructive" : "text-success")}>
                  {brl(data.profit)}
                </td>
                <td className="p-2 pr-4 text-right tabular-nums">
                  {data.revenue ? `${(data.margin * 100).toFixed(0)}%` : "—"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
