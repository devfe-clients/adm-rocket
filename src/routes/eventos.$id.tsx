import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Num, PaidToggle, Sel, Txt } from "@/components/fields";
import { useStore } from "@/lib/store";
import { barLine, boxCommission, brl, cashierNet, eventDRE, sum } from "@/lib/calc";
import { COST_CATEGORIES, type RocketEvent, type Cashier, type Box, type Cost, type BarItem, type Courtesy } from "@/lib/types";
import { uid } from "@/services/seed";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eventos/$id")({
  head: () => ({ meta: [
    { title: "Fechamento do evento — Rocket Gestão" }, { name: "description", content: "Caixas, camarotes, custos, bar e DRE do evento." },
    { property: "og:title", content: "Fechamento do evento — Rocket Gestão" }, { property: "og:description", content: "DRE automático do evento." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: EventPage,
});

type Col<T> = { h: string; w?: string; render: (row: T, set: (fn: (r: T) => void) => void) => ReactNode };

function Grid<T extends { id: string }>({ rows, cols, onChange, onAdd, onRemove, footer }: {
  rows: T[]; cols: Col<T>[]; onChange: (id: string, fn: (r: T) => void) => void; onAdd: () => void; onRemove: (id: string) => void; footer?: ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs text-muted-foreground"><tr>{cols.map((c) => <th key={c.h} className={cn("p-2 text-left font-medium whitespace-nowrap", c.w)}>{c.h}</th>)}<th className="w-10" /></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id} className="border-t">{cols.map((c) => <td key={c.h} className="p-1.5">{c.render(r, (fn) => onChange(r.id, fn))}</td>)}
              <td className="p-1"><button onClick={() => onRemove(r.id)} className="p-2 text-muted-foreground hover:text-destructive" aria-label="Remover"><Trash2 className="size-4" /></button></td></tr>
          ))}</tbody>
          {footer}
        </table>
      </div>
      <div className="p-2 border-t"><Button variant="ghost" size="sm" onClick={onAdd}><Plus /> Adicionar linha</Button></div>
    </div>
  );
}

const Out = ({ v, neg }: { v: number; neg?: boolean }) => <div className={cn("px-2 text-right tabular-nums whitespace-nowrap", neg && v > 0 && "text-destructive font-semibold")}>{brl(v)}</div>;

function EventPage() {
  const { id } = Route.useParams();
  const { db, update, visibleCompanies, isDirector } = useStore();
  const nav = useNavigate();
  const e = db.events.find((x) => x.id === id);
  if (!e || !visibleCompanies.some((c) => c.id === e.companyId)) return <div className="p-8 text-center"><p>Evento não encontrado.</p><Link to="/eventos" className="text-primary underline">Voltar</Link></div>;
  const s = db.settings;
  const d = eventDRE(e, s);
  const set = (fn: (ev: RocketEvent) => void) => update((db) => { const ev = db.events.find((x) => x.id === id); if (ev) fn(ev); });
  type ListKey = "cashiers" | "boxes" | "costs" | "bar" | "courtesies";
  const ops = <T extends { id: string }>(k: ListKey, blank: () => Omit<T, "id">) => ({
    rows: e[k] as unknown as T[],
    onChange: (rid: string, fn: (r: T) => void) => set((ev) => { const r = (ev[k] as unknown as T[]).find((x) => x.id === rid); if (r) fn(r); }),
    onAdd: () => set((ev) => { (ev[k] as unknown[]).push({ id: uid(), ...blank() }); }),
    onRemove: (rid: string) => set((ev) => { (ev[k] as { id: string }[]) = (ev[k] as { id: string }[]).filter((x) => x.id !== rid) as never; }),
  });
  const n = <T,>(key: keyof T) => (r: T, st: (fn: (r: T) => void) => void) => <Num value={r[key] as number} onChange={(v) => st((x) => { (x[key] as number) = v; })} />;
  const t = <T,>(key: keyof T) => (r: T, st: (fn: (r: T) => void) => void) => <Txt value={r[key] as string} onChange={(v) => st((x) => { (x[key] as string) = v; })} />;

  return (
    <div>
      <Link to="/eventos" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-3"><ArrowLeft className="size-4" /> Eventos</Link>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
        <div><h1 className="text-2xl md:text-3xl font-bold">{e.name}</h1><p className="text-sm text-muted-foreground">{db.companies.find((c) => c.id === e.companyId)?.name}</p></div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <Stat label="Receita" v={d.revenue} /><Stat label="Custos" v={d.costs} /><Stat label="Lucro" v={d.profit} tone />
        </div>
      </div>

      <Tabs defaultValue="id">
        <TabsList className="w-full justify-start overflow-x-auto h-auto flex-nowrap">
          {([["id", "Evento"], ["caixas", "Caixas"], ["camarotes", "Camarotes"], ["custos", "Custos"], ["bar", "Bar"], ["dre", "DRE"]] as const).map(([v, l]) => <TabsTrigger key={v} value={v} className="py-2">{l}</TabsTrigger>)}
        </TabsList>

        <TabsContent value="id" className="mt-4">
          <div className="rounded-xl border bg-card p-4 grid gap-4 sm:grid-cols-2">
            <F label="Nome do evento"><Txt value={e.name} onChange={(v) => set((x) => { x.name = v; })} /></F>
            <F label="Data"><Txt type="date" value={e.date} onChange={(v) => set((x) => { x.date = v; })} /></F>
            <F label="Casa"><Sel value={e.companyId} onChange={(v) => set((x) => { x.companyId = v; })} options={visibleCompanies.map((c) => ({ value: c.id, label: c.name }))} /></F>
            <F label="Produtor / Parceiro"><Txt value={e.partner} onChange={(v) => set((x) => { x.partner = v; })} /></F>
            <F label={`% do lucro da casa (parceiro: ${Math.round((1 - e.houseShare) * 100)}%)`}><Num value={Math.round(e.houseShare * 100)} onChange={(v) => set((x) => { x.houseShare = Math.min(100, Math.max(0, v)) / 100; })} /></F>
            {isDirector && <div className="flex items-end"><Button variant="outline" className="text-destructive" onClick={() => { if (window.confirm("Excluir evento?")) { update((db) => { db.events = db.events.filter((x) => x.id !== id); }); nav({ to: "/eventos" }); } }}><Trash2 /> Excluir evento</Button></div>}
          </div>
        </TabsContent>

        <TabsContent value="caixas" className="mt-4">
          <Grid {...ops<Cashier>("cashiers", () => ({ operator: "", card: 0, cash: 0, pix: 0, refunds: 0, sangria: 0 }))} cols={[
            { h: "Operador", render: t("operator") }, { h: "Cartão", render: n("card") }, { h: "Dinheiro", render: n("cash") }, { h: "PIX", render: n("pix") },
            { h: "Devoluções", render: n("refunds") }, { h: "Sangria", render: n("sangria") }, { h: "Total líquido", render: (r) => <Out v={cashierNet(r)} /> },
          ]} footer={<tfoot className="border-t font-bold"><tr><td className="p-2">Total</td>{(["card", "cash", "pix", "refunds", "sangria"] as const).map((k) => <td key={k} className="p-2 text-right tabular-nums">{brl(sum(e.cashiers.map((c) => c[k])))}</td>)}<td className="p-2 text-right tabular-nums">{brl(d.cashiers)}</td><td /></tr></tfoot>} />
          <p className="text-xs text-muted-foreground mt-2">Sangria é o dinheiro retirado do caixa durante a madrugada — não altera o total, serve para conferência do espécie.</p>
        </TabsContent>

        <TabsContent value="camarotes" className="mt-4">
          <Grid {...ops<Box>("boxes", () => ({ lot: "", client: "", value: 0, consumption: 0, deposit: 0, doorCard: 0, doorCash: 0, seller: "", commission: 0 }))} cols={[
            { h: "Lote/Camarote", render: t("lot") }, { h: "Cliente", render: t("client") }, { h: "Valor venda", render: n("value") }, { h: "Consumação", render: n("consumption") },
            { h: "Sinal", render: n("deposit") }, { h: "A receber", render: (r) => <Out v={r.value - r.deposit} /> }, { h: "Porta cartão", render: n("doorCard") }, { h: "Porta dinheiro", render: n("doorCash") },
            { h: "Vendedor/Promoter", render: t("seller") },
            { h: s.commissionMode === "percentual" ? `Comissão (${s.commissionPct}%)` : "Comissão", render: (r, st) => s.commissionMode === "percentual" ? <Out v={boxCommission(r.value, r.commission, s)} /> : <Num value={r.commission} onChange={(v) => st((x) => { x.commission = v; })} /> },
          ]} footer={<tfoot className="border-t font-bold"><tr><td className="p-2" colSpan={2}>Total</td><td className="p-2 text-right">{brl(d.boxes)}</td><td colSpan={6} /><td className="p-2 text-right">{brl(d.commissions)}</td><td /></tr></tfoot>} />
          <p className="text-xs text-muted-foreground mt-2">Consumação não é cortesia: já está paga no valor do camarote.</p>
        </TabsContent>

        <TabsContent value="custos" className="mt-4">
          <Grid {...ops<Cost>("costs", () => ({ item: "", category: "Estrutura" as const, value: 0, paid: false }))} cols={[
            { h: "Item", render: t("item") },
            { h: "Categoria", render: (r, st) => <Sel value={r.category} onChange={(v) => st((x) => { x.category = v; })} options={COST_CATEGORIES.map((c) => ({ value: c, label: c }))} /> },
            { h: "Valor", render: n("value") }, { h: "Pago?", render: (r, st) => <PaidToggle paid={r.paid} onToggle={() => st((x) => { x.paid = !x.paid; })} /> },
          ]} />
          <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2">{COST_CATEGORIES.map((c) => <Stat key={c} label={c} v={d.byCategory[c] ?? 0} />)}</div>
        </TabsContent>

        <TabsContent value="bar" className="mt-4 space-y-4">
          {s.barMode === "consolidado" ? (
            <div className="rounded-xl border bg-card p-4 max-w-sm"><F label="Custo total do bar (lançamento consolidado)"><Num value={e.barConsolidated} onChange={(v) => set((x) => { x.barConsolidated = v; })} /></F>
              <p className="text-xs text-muted-foreground mt-2">Altere para contagem garrafa a garrafa em Ajustes.</p></div>
          ) : (
            <Grid {...ops<BarItem>("bar", () => ({ product: "", initial: 0, final: 0, unitCost: 0, sold: 0, owner: "casa" as const }))} cols={[
              { h: "Produto", render: t("product") },
              { h: "Origem", render: (r, st) => <Sel value={r.owner} onChange={(v) => st((x) => { x.owner = v; })} options={[{ value: "casa", label: "Casa" }, { value: "consignado", label: "Consignado" }]} /> },
              { h: "Inicial", render: n("initial") }, { h: "Final", render: n("final") }, { h: "Usou", render: (r) => <div className="px-2 text-right">{barLine(r).used}</div> },
              { h: "Custo unit.", render: n("unitCost") }, { h: "Vendido (PDV)", render: n("sold") },
              { h: "Furo", render: (r) => <div className={cn("px-2 text-right", barLine(r).loss > 0 && "text-destructive font-semibold")}>{barLine(r).loss}</div> },
              { h: "Valor furo", render: (r) => <Out v={barLine(r).lossValue} neg /> }, { h: "Custo casa", render: (r) => <Out v={barLine(r).cost} /> },
            ]} footer={<tfoot className="border-t font-bold"><tr><td className="p-2" colSpan={8}>Total</td><td className="p-2 text-right text-destructive">{brl(d.losses)}</td><td className="p-2 text-right">{brl(d.bar)}</td><td /></tr></tfoot>} />
          )}
          <div><h3 className="font-semibold mb-2">Gerência (cortesias a R$ 0,00)</h3>
            <Grid {...ops<Courtesy>("courtesies", () => ({ product: "", qty: 0, note: "" }))} cols={[{ h: "Produto", render: t("product") }, { h: "Qtd", render: n("qty") }, { h: "Observação", render: t("note") }]} /></div>
        </TabsContent>

        <TabsContent value="dre" className="mt-4">
          <div className="rounded-xl border bg-card p-4 max-w-xl space-y-1 text-sm">
            <h3 className="font-semibold text-base mb-2">Resumo DRE — {e.name}</h3>
            <L k="Caixas (líquido)" v={d.cashiers} /><L k="Camarotes" v={d.boxes} /><L k="Receita total de entradas" v={d.revenue} b />
            <div className="h-2" />
            {COST_CATEGORIES.map((c) => <L key={c} k={c} v={-(d.byCategory[c] ?? 0)} />)}
            <L k={`Bar (${s.barMode})`} v={-d.bar} /><L k="Comissões camarote" v={-d.commissions} /><L k="Total de custos" v={-d.costs} b />
            <div className="h-2" />
            <L k="Lucro líquido do evento" v={d.profit} b tone />
            <L k={`Parte da casa (${Math.round(e.houseShare * 100)}%)`} v={d.house} /><L k={`Repasse parceiro ${e.partner ? `(${e.partner})` : ""}`} v={d.partner} />
            {d.losses > 0 && <p className="pt-2 text-xs text-destructive">Furos de bar sem registro: {brl(d.losses)}</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const F = ({ label, children }: { label: string; children: ReactNode }) => <label className="block text-sm"><span className="mb-1 block text-xs text-muted-foreground">{label}</span>{children}</label>;
const Stat = ({ label, v, tone }: { label: string; v: number; tone?: boolean }) => (
  <div className="rounded-lg border bg-card px-3 py-2"><p className="text-[11px] text-muted-foreground truncate">{label}</p><p className={cn("font-bold tabular-nums text-sm", tone && (v < 0 ? "text-destructive" : "text-success"))}>{brl(v)}</p></div>
);
const L = ({ k, v, b, tone }: { k: string; v: number; b?: boolean; tone?: boolean }) => (
  <div className={cn("flex justify-between py-1", b && "border-t font-bold pt-2")}><span>{k}</span><span className={cn("tabular-nums", tone && (v < 0 ? "text-destructive" : "text-success"))}>{brl(v)}</span></div>
);
