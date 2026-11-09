import type { DB } from "@/lib/types";

export const uid = () => Math.random().toString(36).slice(2, 10);

// Banco inicial de entrega: só empresas, configurações e o diretor. Sem dados fictícios.
export function seed(): DB {
  return {
    companies: [
      { id: "beach", name: "Rocket Beach", short: "Beach" },
      { id: "sea", name: "Rocket Sea", short: "Sea" },
      { id: "eventos", name: "Rocket Eventos", short: "Eventos" },
    ],
    events: [],
    payables: [],
    receivables: [],
    users: [
      { id: "u1", name: "Felipe (Diretor)", email: "fellipe@rocket.com.br", role: "diretor", companyIds: ["beach", "sea", "eventos"] },
    ],
    currentUserId: "u1",
    settings: { barMode: "detalhado", commissionMode: "percentual", commissionPct: 5, categories: ["Utilidades", "Bebidas", "Obras", "Pessoal", "Impostos", "Aluguel"] },
  };
}
