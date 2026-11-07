import type { DB, RocketEvent } from "@/lib/types";

export const uid = () => Math.random().toString(36).slice(2, 10);

const y = new Date().getFullYear();
const m = String(new Date().getMonth() + 1).padStart(2, "0");
const d = (day: number) => `${y}-${m}-${String(day).padStart(2, "0")}`;

function felipeRet(): RocketEvent {
  return {
    id: "ev-felipe", companyId: "sea", name: "Felipe Ret", date: d(2), partner: "Produtora Arthur", houseShare: 0.5,
    cashiers: [
      { id: uid(), operator: "Site (antecipado)", card: 235890, cash: 0, pix: 0, refunds: 0, sangria: 0 },
      { id: uid(), operator: "Caixa Porta", card: 8650, cash: 2420, pix: 0, refunds: 0, sangria: 0 },
      { id: uid(), operator: "Alessandra", card: 9185, cash: 655, pix: 0, refunds: 0, sangria: 400 },
      { id: uid(), operator: "Bianca", card: 5033, cash: 3725, pix: 0, refunds: 190, sangria: 2000 },
      { id: uid(), operator: "Eduardo", card: 9012, cash: 1190, pix: 0, refunds: 0, sangria: 500 },
    ],
    boxes: [
      { id: uid(), lot: "PREMIUM 01", client: "Felipe", value: 10000, consumption: 6000, deposit: 7500, doorCard: 2500, doorCash: 0, seller: "Patricia", commission: 500 },
      { id: uid(), lot: "PREMIUM 03", client: "Diego Macedo", value: 15000, consumption: 10000, deposit: 15000, doorCard: 0, doorCash: 0, seller: "Rafael", commission: 750 },
      { id: uid(), lot: "ORANGE 04", client: "WL", value: 10000, consumption: 5000, deposit: 2000, doorCard: 2000, doorCash: 6000, seller: "Henrique", commission: 500 },
      { id: uid(), lot: "VARANDA 10", client: "Antonio Rei das Carnes", value: 6000, consumption: 3000, deposit: 1000, doorCard: 2800, doorCash: 2200, seller: "Raphael", commission: 300 },
    ],
    costs: [
      { id: uid(), item: "Espaço Rocket", category: "Estrutura", value: 15000, paid: true },
      { id: uid(), item: "Som / Luz e mesa", category: "Estrutura", value: 25000, paid: true },
      { id: uid(), item: "ECAD", category: "Estrutura", value: 23589, paid: false },
      { id: uid(), item: "Cachê Felipe Ret", category: "Atrações/Logística", value: 380000, paid: true },
      { id: uid(), item: "Aéreas e hotel", category: "Atrações/Logística", value: 35847, paid: true },
      { id: uid(), item: "Equipe limpeza", category: "Pessoal/Equipe", value: 2000, paid: true },
      { id: uid(), item: "Tráfego pago", category: "Divulgação/Marketing", value: 6000, paid: false },
      { id: uid(), item: "Gelo e água", category: "Bar/Insumos", value: 3520, paid: true },
    ],
    bar: [
      { id: uid(), product: "Água", initial: 1848, final: 232, unitCost: 1.5, sold: 1590, owner: "casa" },
      { id: uid(), product: "Red Bull Trad", initial: 2232, final: 0, unitCost: 8.5, sold: 2200, owner: "casa" },
      { id: uid(), product: "Heineken", initial: 946, final: 37, unitCost: 4.5, sold: 900, owner: "casa" },
      { id: uid(), product: "Ciroc Red", initial: 114, final: 76, unitCost: 220, sold: 36, owner: "consignado" },
      { id: uid(), product: "Absolut", initial: 67, final: 54, unitCost: 80, sold: 12, owner: "casa" },
    ],
    courtesies: [{ id: uid(), product: "Chandon CASA", qty: 3, note: "Camarim" }],
    barConsolidated: 0,
  };
}

function small(id: string, companyId: string, name: string, day: number, rev: number, cost: number): RocketEvent {
  return {
    id, companyId, name, date: d(day), partner: "—", houseShare: 1,
    cashiers: [{ id: uid(), operator: "Caixa 1", card: rev * 0.6, cash: rev * 0.2, pix: rev * 0.2, refunds: 0, sangria: 0 }],
    boxes: [], bar: [], courtesies: [], barConsolidated: 0,
    costs: [{ id: uid(), item: "Atração", category: "Atrações/Logística", value: cost * 0.6, paid: true },
            { id: uid(), item: "Equipe", category: "Pessoal/Equipe", value: cost * 0.4, paid: true }],
  };
}

export function seed(): DB {
  return {
    companies: [
      { id: "beach", name: "Rocket Beach", short: "Beach" },
      { id: "sea", name: "Rocket Sea", short: "Sea" },
      { id: "eventos", name: "Rocket Eventos", short: "Eventos" },
    ],
    events: [
      felipeRet(),
      small("ev-sunset", "beach", "Sunset Sessions", 8, 48000, 31000),
      small("ev-luau", "beach", "Luau de Verão", 15, 22000, 29500),
      small("ev-corp", "eventos", "Corporativo TechCo", 12, 85000, 52000),
    ],
    payables: [
      { id: uid(), name: "Energia elétrica", companyId: "beach", value: 8400, due: d(10), category: "Utilidades", type: "Despesa", paid: false },
      { id: uid(), name: "Ambev", companyId: "sea", value: 42000, due: d(5), category: "Bebidas", type: "Despesa", paid: true },
      { id: uid(), name: "Reforma deck", companyId: "beach", value: 65000, due: d(20), category: "Obras", type: "Investimento", paid: false },
      { id: uid(), name: "Folha de pagamento", companyId: "eventos", value: 38000, due: d(5), category: "Pessoal", type: "Despesa", paid: false },
    ],
    receivables: [
      { id: uid(), client: "TechCo (sinal)", companyId: "eventos", date: d(1), value: 30000, due: d(1), paid: true },
      { id: uid(), client: "Aluguel espaço - Casamento", companyId: "sea", date: d(3), value: 18000, due: d(25), paid: false },
    ],
    users: [
      { id: "u1", name: "Felipe (Diretor)", email: "diretor@rocket.com", role: "diretor", companyIds: ["beach", "sea", "eventos"] },
      { id: "u2", name: "Carla (Gerente Sea)", email: "gerente@rocket.com", role: "gerente", companyIds: ["sea"] },
    ],
    currentUserId: "u1",
    settings: { barMode: "detalhado", commissionMode: "percentual", commissionPct: 5, categories: ["Utilidades", "Bebidas", "Obras", "Pessoal", "Impostos", "Aluguel"] },
  };
}
