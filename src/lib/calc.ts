import type { BarItem, EventRevenueCategory, RocketEvent, Settings } from "./types";

export const sum = (xs: number[]) => xs.reduce((a, b) => a + (Number(b) || 0), 0);
export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function barLine(b: BarItem) {
  const used = Math.max(0, b.initial - b.final);
  const loss = Math.max(0, used - b.sold);
  return { used, loss, cost: b.owner === "casa" ? used * b.unitCost : 0, lossValue: loss * b.unitCost };
}

export function cashierNet(c: { card: number; cash: number; pix: number; refunds: number }) {
  return c.card + c.cash + c.pix - c.refunds;
}

export function boxCommission(value: number, commission: number, s: Pick<Settings, "commissionMode" | "commissionPct">) {
  return s.commissionMode === "percentual" ? (value * s.commissionPct) / 100 : commission;
}

export function getEventRevenues(e: RocketEvent) {
  if (e.revenues && e.revenues.length > 0) return e.revenues;
  if (e.boxes && e.boxes.length > 0) {
    return e.boxes.map((b) => ({
      id: b.id,
      item: b.client || b.lot || "Receita",
      category: (b.client?.toLowerCase().includes("camarote") ? "Camarote" : "Bilheteria") as EventRevenueCategory,
      value: b.value,
      received: true,
    }));
  }
  return [];
}

export function eventDRE(e: RocketEvent, s: Pick<Settings, "barMode" | "commissionMode" | "commissionPct">) {
  const cashiers = sum(e.cashiers.map(cashierNet));
  const boxes = sum((e.boxes ?? []).map((b) => b.value));
  const eventRevenues = getEventRevenues(e);
  const revenues = sum(eventRevenues.map((r) => r.value));
  const revenuesByCategory: Record<string, number> = {};
  for (const r of eventRevenues) revenuesByCategory[r.category] = (revenuesByCategory[r.category] ?? 0) + r.value;
  const revenue = cashiers + revenues;
  const byCategory: Record<string, number> = {};
  for (const c of e.costs) byCategory[c.category] = (byCategory[c.category] ?? 0) + c.value;
  const bar = s.barMode === "detalhado" ? sum(e.bar.map((b) => barLine(b).cost)) : e.barConsolidated;
  const losses = s.barMode === "detalhado" ? sum(e.bar.map((b) => barLine(b).lossValue)) : 0;
  const commissions = sum((e.boxes ?? []).map((b) => boxCommission(b.value, b.commission, s)));
  const costs = sum(e.costs.map((c) => c.value)) + bar + commissions;
  const profit = revenue - costs;
  const house = profit * e.houseShare;
  return { cashiers, boxes, revenues, revenuesByCategory, revenue, byCategory, bar, losses, commissions, costs, profit, house, partner: profit - house, margin: revenue ? profit / revenue : 0 };
}

export const inPeriod = (date: string, month: number | "all", year: number) => {
  const d = new Date(date + "T12:00:00");
  return d.getFullYear() === year && (month === "all" || d.getMonth() + 1 === month);
};
