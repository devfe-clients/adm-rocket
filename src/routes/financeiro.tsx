import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Num, PaidToggle, PeriodFilter, Sel, Txt } from "@/components/fields";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import { usePeriod } from "@/lib/usePeriod";
import { brl, inPeriod, sum } from "@/lib/calc";
import { uid } from "@/services/seed";

export const Route = createFileRoute("/financeiro")({
  head: () => ({ meta: [
    { title: "Financeiro — Rocket Gestão" }, { name: "description", content: "Contas a pagar e a receber por empresa." },
    { property: "og:title", content: "Financeiro — Rocket Gestão" }, { property: "og:description", content: "Contas a pagar e a receber." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Finance,
});

const td = "p-1.5";
function Finance() {
  const { db, update, visibleCompanies } = useStore();
  const p = usePeriod();
  const companies = visibleCompanies.map((c) => ({ value: c.id, label: c.short }));
  const defCo = p.company !== "all" ? p.company : visibleCompanies[0]?.id;
  const today = new Date().toISOString().slice(0, 10);
  const pays = db.payables.filter((x) => p.matchCompany(x.companyId) && inPeriod(x.due, p.month, p.year)).sort((a, b) => a.due.localeCompare(b.due));
  const recs = db.receivables.filter((x) => p.matchCompany(x.companyId) && inPeriod(x.date, p.month, p.year)).sort((a, b) => a.date.localeCompare(b.date));
  const cats = db.settings.categories.map((c) => ({ value: c, label: c }));

  return (
    <div>
      <PageHeader title="Financeiro da casa" subtitle="Cada empresa com seu próprio caixa"><PeriodFilter {...p} /></PageHeader>
      <Tabs defaultValue="pagar">
        <TabsList><TabsTrigger value="pagar">Contas a pagar</TabsTrigger><TabsTrigger value="receber">A receber / Faturamento</TabsTrigger></TabsList>

        <TabsContent value="pagar" className="mt-4">
          <Summary items={[["Total", sum(pays.map((x) => x.value))], ["Pago", sum(pays.filter((x) => x.paid).map((x) => x.value))], ["Pendente", sum(pays.filter((x) => !x.paid).map((x) => x.value))]]} />
          <div className="rounded-xl border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs text-muted-foreground"><tr>{["Nome/Fornecedor", "Empresa", "Valor", "Vencimento", "Categoria", "Tipo", "Pago"].map((h) => <th key={h} className="p-2 text-left font-medium">{h}</th>)}<th /></tr></thead>
              <tbody>{pays.map((x) => {
                const s = (fn: (r: typeof x) => void) => update((d) => { const r = d.payables.find((y) => y.id === x.id); if (r) fn(r); });
                return (<tr key={x.id} className="border-t">
                  <td className={td}><Txt value={x.name} onChange={(v) => s((r) => { r.name = v; })} /></td>
                  <td className={td}><Sel value={x.companyId} onChange={(v) => s((r) => { r.companyId = v; })} options={companies} /></td>
                  <td className={td}><Num value={x.value} onChange={(v) => s((r) => { r.value = v; })} /></td>
                  <td className={td}><Txt type="date" value={x.due} onChange={(v) => s((r) => { r.due = v; })} /></td>
                  <td className={td}><Sel value={x.category} onChange={(v) => s((r) => { r.category = v; })} options={cats.some((c) => c.value === x.category) ? cats : [{ value: x.category, label: x.category }, ...cats]} /></td>
                  <td className={td}><Sel value={x.type} onChange={(v) => s((r) => { r.type = v; })} options={[{ value: "Despesa", label: "Despesa" }, { value: "Investimento", label: "Investimento" }]} /></td>
                  <td className={td}><PaidToggle paid={x.paid} onToggle={() => s((r) => { r.paid = !r.paid; })} /></td>
                  <td className={td}><button onClick={() => update((d) => { d.payables = d.payables.filter((y) => y.id !== x.id); })} className="p-2 text-muted-foreground hover:text-destructive" aria-label="Remover"><Trash2 className="size-4" /></button></td>
                </tr>); })}</tbody>
            </table>
            <div className="p-2 border-t"><Button variant="ghost" size="sm" onClick={() => update((d) => { d.payables.push({ id: uid(), name: "", companyId: defCo, value: 0, due: today, category: d.settings.categories[0] ?? "Geral", type: "Despesa", paid: false }); })}><Plus /> Nova conta a pagar</Button></div>
          </div>
        </TabsContent>

        <TabsContent value="receber" className="mt-4">
          <Summary items={[["Total", sum(recs.map((x) => x.value))], ["Recebido", sum(recs.filter((x) => x.paid).map((x) => x.value))], ["Pendente", sum(recs.filter((x) => !x.paid).map((x) => x.value))]]} />
          <div className="rounded-xl border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs text-muted-foreground"><tr>{["Cliente/Origem", "Empresa", "Data", "Valor", "Vencimento", "Pago"].map((h) => <th key={h} className="p-2 text-left font-medium">{h}</th>)}<th /></tr></thead>
              <tbody>{recs.map((x) => {
                const s = (fn: (r: typeof x) => void) => update((d) => { const r = d.receivables.find((y) => y.id === x.id); if (r) fn(r); });
                return (<tr key={x.id} className="border-t">
                  <td className={td}><Txt value={x.client} onChange={(v) => s((r) => { r.client = v; })} /></td>
                  <td className={td}><Sel value={x.companyId} onChange={(v) => s((r) => { r.companyId = v; })} options={companies} /></td>
                  <td className={td}><Txt type="date" value={x.date} onChange={(v) => s((r) => { r.date = v; })} /></td>
                  <td className={td}><Num value={x.value} onChange={(v) => s((r) => { r.value = v; })} /></td>
                  <td className={td}><Txt type="date" value={x.due} onChange={(v) => s((r) => { r.due = v; })} /></td>
                  <td className={td}><PaidToggle paid={x.paid} onToggle={() => s((r) => { r.paid = !r.paid; })} /></td>
                  <td className={td}><button onClick={() => update((d) => { d.receivables = d.receivables.filter((y) => y.id !== x.id); })} className="p-2 text-muted-foreground hover:text-destructive" aria-label="Remover"><Trash2 className="size-4" /></button></td>
                </tr>); })}</tbody>
            </table>
            <div className="p-2 border-t"><Button variant="ghost" size="sm" onClick={() => update((d) => { d.receivables.push({ id: uid(), client: "", companyId: defCo, date: today, value: 0, due: today, paid: false }); })}><Plus /> Novo recebimento</Button></div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Summary({ items }: { items: [string, number][] }) {
  return <div className="grid grid-cols-3 gap-2 mb-3">{items.map(([k, v]) => <div key={k} className="rounded-lg border bg-card px-3 py-2"><p className="text-xs text-muted-foreground">{k}</p><p className="font-bold tabular-nums text-sm md:text-base">{brl(v)}</p></div>)}</div>;
}
