import type { DB } from "@/lib/types";

export const uid = () => Math.random().toString(36).slice(2, 10);

export const DEFAULT_EXPENSE_CATS = ["Salários", "Comissões", "Fornecedores", "Utilidades", "Bebidas", "Obras", "Pessoal", "Impostos", "Aluguel"];
export const DEFAULT_REVENUE_CATS = ["Aluguel de Jet", "Garagem de Jet", "Clube do Jet", "Marinharia", "Outras receitas"];

// Atualiza bancos já existentes (ex.: Firestore) com a Marina Foguete e as novas categorias.
export function migrate(db: DB): DB {
  if (!db.companies.some((c) => c.id === "marina")) {
    db.companies.push({ id: "marina", name: "Marina Foguete", short: "Marina" });
    db.users.filter((u) => u.role === "diretor").forEach((u) => { if (!u.companyIds.includes("marina")) u.companyIds.push("marina"); });
  }
  // Remove a empresa "Rocket Eventos" quando não há registros ligados a ela (eventos ficam na casa onde acontecem).
  const usesEventos = [...db.events, ...db.payables, ...db.receivables].some((x) => x.companyId === "eventos");
  if (!usesEventos) {
    db.companies = db.companies.filter((c) => c.id !== "eventos");
    db.users.forEach((u) => { u.companyIds = u.companyIds.filter((id) => id !== "eventos"); });
  }
  for (const c of ["Salários", "Comissões", "Fornecedores"]) if (!db.settings.categories.includes(c)) db.settings.categories.unshift(c);
  if (!db.settings.revenueCategories?.length) db.settings.revenueCategories = [...DEFAULT_REVENUE_CATS];
  return db;
}

// Banco inicial de entrega: só empresas, configurações e o diretor. Sem dados fictícios.
export function seed(): DB {
  return {
    companies: [
      { id: "beach", name: "Rocket Beach", short: "Beach" },
      { id: "sea", name: "Rocket Sea", short: "Sea" },
      { id: "marina", name: "Marina Foguete", short: "Marina" },
    ],
    events: [],
    payables: [],
    receivables: [],
    users: [
      { id: "u1", name: "Felipe (Diretor)", email: "fellipe@rocket.com.br", role: "diretor", companyIds: ["beach", "sea", "marina"] },
    ],
    currentUserId: "u1",
    settings: { barMode: "detalhado", commissionMode: "percentual", commissionPct: 5, categories: [...DEFAULT_EXPENSE_CATS], revenueCategories: [...DEFAULT_REVENUE_CATS] },
  };
}
