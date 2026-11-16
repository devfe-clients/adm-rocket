import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Calendar, CheckCircle2, Clock, AlertCircle, CalendarDays, Printer, X } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Num, PaidToggle, PeriodFilter, Sel, Txt, MONTHS } from "@/components/fields";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import { usePeriod } from "@/lib/usePeriod";
import { brl, inPeriod, sum } from "@/lib/calc";
import { uid } from "@/services/seed";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/financeiro")({
  head: () => ({ meta: [
    { title: "Financeiro — Rocket Gestão" }, { name: "description", content: "Contas a pagar e a receber por empresa." },
    { property: "og:title", content: "Financeiro — Rocket Gestão" }, { property: "og:description", content: "Contas a pagar e a receber." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Finance,
});

type QuickFilter = "todos" | "a_vencer" | "hoje" | "semana" | "pago" | "vencido";

function isThisWeek(dateStr: string, todayStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr + "T00:00:00");
  const t = new Date(todayStr + "T00:00:00");
  const diffDays = Math.ceil((d.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 7;
}

function formatDateBR(dateStr: string): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return d && m && y ? `${d}/${m}/${y}` : dateStr;
}

const td = "p-1.5";

function Finance() {
  const { db, update, visibleCompanies } = useStore();
  const p = usePeriod();
  const companies = visibleCompanies.filter((c) => c.id !== "eventos").map((c) => ({ value: c.id, label: c.short }));
  const defCo = p.company !== "all" ? p.company : (companies[0]?.value ?? db.companies[0]!.id);
  const today = new Date().toISOString().slice(0, 10);

  const [payFilter, setPayFilter] = useState<QuickFilter>("todos");
  const [recFilter, setRecFilter] = useState<QuickFilter>("todos");

  // Filtro de data personalizada (De / Até)
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const hasCustomDate = Boolean(startDate || endDate);

  const matchCustomPeriod = (targetDate: string) => {
    if (!targetDate) return false;
    if (startDate && targetDate < startDate) return false;
    if (endDate && targetDate > endDate) return false;
    return true;
  };

  // Se tiver data personalizada preenchida, filtra pelo intervalo; se não, filtra pelo mês selecionado
  const allPays = db.payables
    .filter((x) => p.matchCompany(x.companyId) && (hasCustomDate ? matchCustomPeriod(x.due) : inPeriod(x.due, p.month, p.year)))
    .sort((a, b) => a.due.localeCompare(b.due));

  const allRecs = db.receivables
    .filter((x) => p.matchCompany(x.companyId) && (hasCustomDate ? matchCustomPeriod(x.due || x.date) : inPeriod(x.date, p.month, p.year)))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Estatísticas de Contas a Pagar
  const payPaid = allPays.filter((x) => x.paid);
  const payPending = allPays.filter((x) => !x.paid);
  const payToday = allPays.filter((x) => !x.paid && x.due === today);
  const payWeek = allPays.filter((x) => !x.paid && isThisWeek(x.due, today));
  const payOverdue = allPays.filter((x) => !x.paid && x.due && x.due < today);

  // Filtro ativo de Contas a Pagar
  const pays = allPays.filter((x) => {
    if (payFilter === "pago") return x.paid;
    if (payFilter === "a_vencer") return !x.paid;
    if (payFilter === "hoje") return !x.paid && x.due === today;
    if (payFilter === "semana") return !x.paid && isThisWeek(x.due, today);
    if (payFilter === "vencido") return !x.paid && x.due && x.due < today;
    return true;
  });

  // Estatísticas de A Receber
  const recPaid = allRecs.filter((x) => x.paid);
  const recPending = allRecs.filter((x) => !x.paid);
  const recToday = allRecs.filter((x) => !x.paid && (x.due === today || x.date === today));
  const recWeek = allRecs.filter((x) => !x.paid && isThisWeek(x.due || x.date, today));
  const recOverdue = allRecs.filter((x) => !x.paid && (x.due || x.date) && (x.due || x.date) < today);

  // Filtro ativo de A Receber
  const recs = allRecs.filter((x) => {
    if (recFilter === "pago") return x.paid;
    if (recFilter === "a_vencer") return !x.paid;
    if (recFilter === "hoje") return !x.paid && (x.due === today || x.date === today);
    if (recFilter === "semana") return !x.paid && isThisWeek(x.due || x.date, today);
    if (recFilter === "vencido") return !x.paid && (x.due || x.date) && (x.due || x.date) < today;
    return true;
  });

  const getCats = (companyId: string) => {
    const list = db.settings.companyCategories?.[companyId]?.length
      ? db.settings.companyCategories[companyId]
      : db.settings.categories;
    return list.map((c) => ({ value: c, label: c }));
  };

  const getRcats = (companyId: string) => {
    const list = db.settings.companyRevenueCategories?.[companyId]?.length
      ? db.settings.companyRevenueCategories[companyId]
      : (db.settings.revenueCategories ?? []);
    return list.map((c) => ({ value: c, label: c }));
  };

  return (
    <div>
      <PageHeader title="Financeiro da casa" subtitle="Cada empresa com seu próprio caixa">
        <PeriodFilter {...p} />
      </PageHeader>

      {/* Barra de Período Personalizado e Botão de Impressão */}
      <div className="print:hidden mb-4 flex flex-wrap items-center justify-between gap-2 p-2.5 bg-card rounded-xl border">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
            <Calendar className="size-3.5 text-primary" /> Período por data:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">De:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 px-2 rounded-md border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Até:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 px-2 rounded-md border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          {hasCustomDate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setStartDate(""); setEndDate(""); }}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="size-3 mr-1" /> Limpar datas
            </Button>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="h-8 gap-1.5 text-xs font-medium ml-auto"
        >
          <Printer className="size-3.5 text-primary" /> Baixar PDF / Imprimir
        </Button>
      </div>

      <Tabs defaultValue="pagar">
        <TabsList>
          <TabsTrigger value="pagar">Contas a pagar</TabsTrigger>
          <TabsTrigger value="receber">A receber / Faturamento</TabsTrigger>
        </TabsList>

        {/* ==================== CONTAS A PAGAR ==================== */}
        <TabsContent value="pagar" className="mt-4 space-y-3">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            <StatCard label={hasCustomDate ? "Total do período" : "Total do mês"} value={sum(allPays.map((x) => x.value))} icon={<Calendar className="size-4 text-muted-foreground" />} />
            <StatCard label="Pago" value={sum(payPaid.map((x) => x.value))} badgeClass="text-emerald-600 dark:text-emerald-400" icon={<CheckCircle2 className="size-4 text-emerald-600" />} />
            <StatCard label="Vence hoje" value={sum(payToday.map((x) => x.value))} badgeClass="text-amber-600 dark:text-amber-400" icon={<Clock className="size-4 text-amber-600" />} />
            <StatCard label="Nesta semana" value={sum(payWeek.map((x) => x.value))} badgeClass="text-blue-600 dark:text-blue-400" icon={<CalendarDays className="size-4 text-blue-600" />} />
            <StatCard label="Vencidas" value={sum(payOverdue.map((x) => x.value))} badgeClass="text-destructive font-bold" icon={<AlertCircle className="size-4 text-destructive" />} />
          </div>

          {/* Barra de Filtros Rápidos */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/60 rounded-lg border text-xs">
            <FilterChip active={payFilter === "todos"} onClick={() => setPayFilter("todos")} label="Todos" count={allPays.length} />
            <FilterChip active={payFilter === "a_vencer"} onClick={() => setPayFilter("a_vencer")} label="A vencer" count={payPending.length} />
            <FilterChip active={payFilter === "hoje"} onClick={() => setPayFilter("hoje")} label="Vence hoje" count={payToday.length} highlight="amber" />
            <FilterChip active={payFilter === "semana"} onClick={() => setPayFilter("semana")} label="Esta semana" count={payWeek.length} highlight="blue" />
            <FilterChip active={payFilter === "pago"} onClick={() => setPayFilter("pago")} label="Pagas" count={payPaid.length} highlight="emerald" />
            {payOverdue.length > 0 && (
              <FilterChip active={payFilter === "vencido"} onClick={() => setPayFilter("vencido")} label="Vencidas" count={payOverdue.length} highlight="destructive" />
            )}
          </div>

          {/* Tabela de Contas a Pagar */}
          <div className="rounded-xl border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs text-muted-foreground">
                <tr>
                  {["Nome/Fornecedor", "Empresa", "Valor", "Vencimento", "Status", "Categoria", "Tipo", "Pago"].map((h) => (
                    <th key={h} className="p-2 text-left font-medium">{h}</th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {pays.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-muted-foreground text-xs">
                      Nenhuma conta encontrada para o filtro selecionado.
                    </td>
                  </tr>
                ) : (
                  pays.map((x) => {
                    const s = (fn: (r: typeof x) => void) => update((d) => { const r = d.payables.find((y) => y.id === x.id); if (r) fn(r); });
                    const rowCats = getCats(x.companyId);
                    return (
                      <tr key={x.id} className="border-t hover:bg-muted/20">
                        <td className={td}><Txt value={x.name} onChange={(v) => s((r) => { r.name = v; })} /></td>
                        <td className={td}><Sel value={x.companyId} onChange={(v) => s((r) => { r.companyId = v; })} options={companies} /></td>
                        <td className={td}><Num value={x.value} onChange={(v) => s((r) => { r.value = v; })} /></td>
                        <td className={td}><Txt type="date" value={x.due} onChange={(v) => s((r) => { r.due = v; })} /></td>
                        <td className={td}>
                          <StatusBadge paid={x.paid} due={x.due} today={today} />
                        </td>
                        <td className={td}><Sel value={x.category} onChange={(v) => s((r) => { r.category = v; })} options={rowCats.some((c) => c.value === x.category) ? rowCats : [{ value: x.category, label: x.category }, ...rowCats]} /></td>
                        <td className={td}><Sel value={x.type} onChange={(v) => s((r) => { r.type = v; })} options={[{ value: "Despesa", label: "Despesa" }, { value: "Investimento", label: "Investimento" }]} /></td>
                        <td className={td}><PaidToggle paid={x.paid} onToggle={() => s((r) => { r.paid = !r.paid; })} /></td>
                        <td className={td}>
                          <button onClick={() => update((d) => { d.payables = d.payables.filter((y) => y.id !== x.id); })} className="p-2 text-muted-foreground hover:text-destructive" aria-label="Remover">
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            <div className="p-2 border-t">
              <Button variant="ghost" size="sm" onClick={() => update((d) => { d.payables.push({ id: uid(), name: "", companyId: defCo, value: 0, due: today, category: getCats(defCo)[0]?.value ?? "Geral", type: "Despesa", paid: false }); })}>
                <Plus className="size-4 mr-1" /> Nova conta a pagar
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ==================== A RECEBER ==================== */}
        <TabsContent value="receber" className="mt-4 space-y-3">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            <StatCard label={hasCustomDate ? "Total do período" : "Total do mês"} value={sum(allRecs.map((x) => x.value))} icon={<Calendar className="size-4 text-muted-foreground" />} />
            <StatCard label="Recebido" value={sum(recPaid.map((x) => x.value))} badgeClass="text-emerald-600 dark:text-emerald-400" icon={<CheckCircle2 className="size-4 text-emerald-600" />} />
            <StatCard label="Recebe hoje" value={sum(recToday.map((x) => x.value))} badgeClass="text-amber-600 dark:text-amber-400" icon={<Clock className="size-4 text-amber-600" />} />
            <StatCard label="Nesta semana" value={sum(recWeek.map((x) => x.value))} badgeClass="text-blue-600 dark:text-blue-400" icon={<CalendarDays className="size-4 text-blue-600" />} />
            <StatCard label="Em atraso" value={sum(recOverdue.map((x) => x.value))} badgeClass="text-destructive font-bold" icon={<AlertCircle className="size-4 text-destructive" />} />
          </div>

          {/* Barra de Filtros Rápidos */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/60 rounded-lg border text-xs">
            <FilterChip active={recFilter === "todos"} onClick={() => setRecFilter("todos")} label="Todos" count={allRecs.length} />
            <FilterChip active={recFilter === "a_vencer"} onClick={() => setRecFilter("a_vencer")} label="A receber" count={recPending.length} />
            <FilterChip active={recFilter === "hoje"} onClick={() => setRecFilter("hoje")} label="Recebe hoje" count={recToday.length} highlight="amber" />
            <FilterChip active={recFilter === "semana"} onClick={() => setRecFilter("semana")} label="Esta semana" count={recWeek.length} highlight="blue" />
            <FilterChip active={recFilter === "pago"} onClick={() => setRecFilter("pago")} label="Recebidos" count={recPaid.length} highlight="emerald" />
            {recOverdue.length > 0 && (
              <FilterChip active={recFilter === "vencido"} onClick={() => setRecFilter("vencido")} label="Em atraso" count={recOverdue.length} highlight="destructive" />
            )}
          </div>

          {/* Tabela de Recebimentos */}
          <div className="rounded-xl border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs text-muted-foreground">
                <tr>
                  {["Cliente/Origem", "Empresa", "Tipo de receita", "Data", "Valor", "Vencimento", "Status", "Pago"].map((h) => (
                    <th key={h} className="p-2 text-left font-medium">{h}</th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {recs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-muted-foreground text-xs">
                      Nenhum recebimento encontrado para o filtro selecionado.
                    </td>
                  </tr>
                ) : (
                  recs.map((x) => {
                    const s = (fn: (r: typeof x) => void) => update((d) => { const r = d.receivables.find((y) => y.id === x.id); if (r) fn(r); });
                    const rowRcats = getRcats(x.companyId);
                    return (
                      <tr key={x.id} className="border-t hover:bg-muted/20">
                        <td className={td}><Txt value={x.client} onChange={(v) => s((r) => { r.client = v; })} /></td>
                        <td className={td}><Sel value={x.companyId} onChange={(v) => s((r) => { r.companyId = v; })} options={companies} /></td>
                        <td className={td}><Sel value={x.category ?? ""} onChange={(v) => s((r) => { r.category = v; })} options={[{ value: "", label: "—" }, ...(x.category && !rowRcats.some((c) => c.value === x.category) ? [{ value: x.category, label: x.category }] : []), ...rowRcats]} /></td>
                        <td className={td}><Txt type="date" value={x.date} onChange={(v) => s((r) => { r.date = v; })} /></td>
                        <td className={td}><Num value={x.value} onChange={(v) => s((r) => { r.value = v; })} /></td>
                        <td className={td}><Txt type="date" value={x.due} onChange={(v) => s((r) => { r.due = v; })} /></td>
                        <td className={td}>
                          <StatusBadge paid={x.paid} due={x.due || x.date} today={today} />
                        </td>
                        <td className={td}><PaidToggle paid={x.paid} onToggle={() => s((r) => { r.paid = !r.paid; })} /></td>
                        <td className={td}>
                          <button onClick={() => update((d) => { d.receivables = d.receivables.filter((y) => y.id !== x.id); })} className="p-2 text-muted-foreground hover:text-destructive" aria-label="Remover">
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            <div className="p-2 border-t">
              <Button variant="ghost" size="sm" onClick={() => update((d) => { d.receivables.push({ id: uid(), client: "", companyId: defCo, date: today, value: 0, due: today, paid: false, category: getRcats(defCo)[0]?.value ?? "" }); })}>
                <Plus className="size-4 mr-1" /> Novo recebimento
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ label, value, icon, badgeClass }: { label: string; value: number; icon?: React.ReactNode; badgeClass?: string }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2 flex items-center justify-between">
      <div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className={cn("font-bold tabular-nums text-xs sm:text-sm md:text-base truncate", badgeClass)}>
          {brl(value)}
        </p>
      </div>
      {icon}
    </div>
  );
}

function FilterChip({ active, onClick, label, count, highlight }: { active: boolean; onClick: () => void; label: string; count: number; highlight?: "amber" | "blue" | "emerald" | "destructive" }) {
  const highlightClass = highlight === "amber"
    ? "text-amber-600 dark:text-amber-400"
    : highlight === "blue"
    ? "text-blue-600 dark:text-blue-400"
    : highlight === "emerald"
    ? "text-emerald-600 dark:text-emerald-400"
    : highlight === "destructive"
    ? "text-destructive font-bold"
    : "";

  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5",
        active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <span>{label}</span>
      <span className={cn("text-[11px] px-1.5 py-0.2 rounded-full bg-muted border", highlightClass)}>
        {count}
      </span>
    </button>
  );
}

function StatusBadge({ paid, due, today }: { paid: boolean; due: string; today: string }) {
  if (paid) {
    return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">Pago</span>;
  }
  if (!due) {
    return <span className="text-[10px] text-muted-foreground">—</span>;
  }
  if (due < today) {
    return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-destructive/15 text-destructive">Vencida</span>;
  }
  if (due === today) {
    return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">Vence hoje</span>;
  }
  if (isThisWeek(due, today)) {
    return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">Nesta semana</span>;
  }
  return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">A vencer</span>;
}
