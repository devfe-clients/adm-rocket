import { describe, expect, it } from "vitest";
import { barLine, eventDRE } from "./calc";
import type { RocketEvent } from "./types";

const ev: RocketEvent = {
  id: "e", companyId: "sea", name: "T", date: "2026-01-01", partner: "P", houseShare: 0.5,
  cashiers: [{ id: "c", operator: "A", card: 1000, cash: 500, pix: 500, refunds: 100, sangria: 300 }],
  boxes: [{ id: "b", lot: "P1", client: "X", value: 10000, consumption: 5000, deposit: 3000, doorCard: 7000, doorCash: 0, seller: "S", commission: 200 }],
  costs: [{ id: "k", item: "Som", category: "Estrutura", value: 4000, paid: true }],
  revenues: [{ id: "r1", item: "Ticketeira", category: "Ticketeira", value: 2000, received: true }],
  bar: [{ id: "x", product: "Água", initial: 100, final: 20, unitCost: 2, sold: 70, owner: "casa" },
        { id: "y", product: "Vodka", initial: 10, final: 5, unitCost: 50, sold: 5, owner: "consignado" }],
  courtesies: [], barConsolidated: 999,
};

describe("DRE do evento", () => {
  it("consignado não entra no custo do bar e furo = usado - vendido", () => {
    expect(barLine(ev.bar[0]!)).toMatchObject({ used: 80, loss: 10, cost: 160 });
    expect(barLine(ev.bar[1]!).cost).toBe(0);
  });
  it("calcula receita, custos e divisão casa/parceiro (comissão percentual 10%)", () => {
    const d = eventDRE(ev, { barMode: "detalhado", commissionMode: "percentual", commissionPct: 10 });
    // cashiers=1900, revenues(revenues field)=2000 → revenue=3900
    // costs: 4000 (estrutura) + 160 (bar casa) + 390 (comissão 10% sobre boxes legado) = 4550
    expect(d.revenue).toBe(1900 + 2000);
    expect(d.revenuesByCategory).toMatchObject({ Ticketeira: 2000 });
    expect(d.costs).toBe(4000 + 160 + 1000);
    expect(d.house).toBe((d.revenue - d.costs) / 2);
  });
  it("modo consolidado e comissão livre", () => {
    const d = eventDRE(ev, { barMode: "consolidado", commissionMode: "livre", commissionPct: 10 });
    expect(d.costs).toBe(4000 + 999 + 200);
  });
});
