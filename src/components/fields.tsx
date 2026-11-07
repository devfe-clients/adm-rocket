import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Num({ value, onChange, className }: { value: number; onChange: (n: number) => void; className?: string }) {
  return (
    <input type="number" inputMode="decimal" value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className={cn("h-9 w-full min-w-20 rounded-md border bg-background px-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring", className)} />
  );
}
export function Txt({ value, onChange, className, type = "text" }: { value: string; onChange: (s: string) => void; className?: string; type?: string }) {
  return <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
    className={cn("h-9 w-full min-w-24 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring", className)} />;
}
export function Sel<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; className?: string }) {
  return <select value={value} onChange={(e) => onChange(e.target.value as T)}
    className={cn("h-9 w-full rounded-md border bg-background px-2 text-sm", className)}>
    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>;
}
export function PaidToggle({ paid, onToggle }: { paid: boolean; onToggle: () => void }) {
  return <button onClick={onToggle} aria-label={paid ? "Pago" : "Não pago"}
    className={cn("h-9 w-12 rounded-md text-sm font-bold transition-colors", paid ? "bg-success text-primary-foreground" : "bg-destructive/15 text-destructive")}>{paid ? "S" : "N"}</button>;
}

export const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function PeriodFilter({ company, setCompany, month, setMonth, year, setYear }: {
  company: string; setCompany: (s: string) => void; month: number | "all"; setMonth: (m: number | "all") => void; year: number; setYear: (y: number) => void;
}) {
  const { visibleCompanies, isDirector } = useStore();
  const now = new Date().getFullYear();
  return (
    <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
      <Sel value={company} onChange={setCompany} options={[...(isDirector || visibleCompanies.length > 1 ? [{ value: "all", label: "Todas" }] : []), ...visibleCompanies.map((c) => ({ value: c.id, label: c.name }))]} />
      <Sel value={String(month)} onChange={(v) => setMonth(v === "all" ? "all" : Number(v))} options={[{ value: "all", label: "Ano todo" }, ...MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))]} />
      <Sel value={String(year)} onChange={(v) => setYear(Number(v))} options={[now - 2, now - 1, now, now + 1].map((y) => ({ value: String(y), label: String(y) }))} />
    </div>
  );
}
