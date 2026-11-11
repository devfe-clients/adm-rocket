export type CompanyId = string;
export interface Company { id: CompanyId; name: string; short: string }

export type CostCategory = "Estrutura" | "Atrações/Logística" | "Pessoal/Equipe" | "Divulgação/Marketing" | "Bar/Insumos";
export const COST_CATEGORIES: CostCategory[] = ["Estrutura", "Atrações/Logística", "Pessoal/Equipe", "Divulgação/Marketing", "Bar/Insumos"];

export interface Cashier { id: string; operator: string; card: number; cash: number; pix: number; refunds: number; sangria: number }
export interface Box { id: string; lot: string; client: string; value: number; consumption: number; deposit: number; doorCard: number; doorCash: number; seller: string; commission: number }
export interface Cost { id: string; item: string; category: CostCategory; value: number; paid: boolean }
export interface BarItem { id: string; product: string; initial: number; final: number; unitCost: number; sold: number; owner: "casa" | "consignado" }
export interface Courtesy { id: string; product: string; qty: number; note: string }

export interface RocketEvent {
  id: string; companyId: CompanyId; name: string; date: string; partner: string;
  houseShare: number; // 0..1
  cashiers: Cashier[]; boxes: Box[]; costs: Cost[]; bar: BarItem[]; courtesies: Courtesy[];
  barConsolidated: number;
}

export interface Payable { id: string; name: string; companyId: CompanyId; value: number; due: string; category: string; type: "Despesa" | "Investimento"; paid: boolean }
export interface Receivable { id: string; client: string; companyId: CompanyId; date: string; value: number; due: string; paid: boolean; category?: string }

export type Role = "diretor" | "gerente";
export interface AppUser { id: string; name: string; email: string; role: Role; companyIds: CompanyId[] }

export interface Settings { barMode: "detalhado" | "consolidado"; commissionMode: "percentual" | "livre"; commissionPct: number; categories: string[]; revenueCategories?: string[] }

export interface DB {
  companies: Company[]; events: RocketEvent[]; payables: Payable[]; receivables: Receivable[];
  users: AppUser[]; currentUserId: string; settings: Settings;
}
