import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LayoutDashboard, CalendarDays, Wallet, Settings, Users, Rocket } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { dataProvider } from "@/services/config";
import { useAuth } from "@/services/auth";
import { LogOut } from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, director: false },
  { to: "/eventos", label: "Eventos", icon: CalendarDays, director: false },
  { to: "/financeiro", label: "Financeiro", icon: Wallet, director: false },
  { to: "/configuracoes", label: "Ajustes", icon: Settings, director: true },
  { to: "/usuarios", label: "Usuários", icon: Users, director: true },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { db, update, user, isDirector } = useStore();
  const { signOut } = useAuth();
  const { pathname } = useLocation();
  const items = NAV.filter((n) => !n.director || isDirector);
  const active = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));
  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden md:flex md:w-60 md:flex-col bg-sidebar text-sidebar-foreground sticky top-0 h-screen p-4 gap-1">
        <div className="flex items-center gap-2 px-2 pb-6 pt-2">
          <img src="/logo.png" alt="Rocket" className="size-6 rounded-md object-cover" />
          <span className="font-display text-lg font-bold">Rocket Gestão</span>
        </div>
        {items.map((n) => (
          <Link key={n.to} to={n.to} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium", active(n.to) ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent")}>
            <n.icon className="size-4" /> {n.label}
          </Link>
        ))}
        <div className="mt-auto space-y-2 text-xs">
          {dataProvider === "local" && (
            <>
              <label className="block opacity-70">Usuário ativo</label>
              <select value={db.currentUserId} onChange={(e) => update((d) => { d.currentUserId = e.target.value; })} className="w-full rounded-md bg-sidebar-accent px-2 py-2">
                {db.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </>
          )}
          {dataProvider === "firebase" && user && (
            <div className="rounded-lg bg-sidebar-accent px-3 py-2">
              <p className="font-medium truncate">{user.name}</p>
              <p className="opacity-60 capitalize">{user.role}</p>
            </div>
          )}
          <p className="opacity-60">Dados: {dataProvider === "local" ? "locais (demo)" : "Firebase"}</p>
          {dataProvider === "firebase" && (
            <button onClick={() => void signOut()} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition">
              <LogOut className="size-3.5" /> Sair
            </button>
          )}
        </div>
      </aside>

      <header className="md:hidden sticky top-0 z-20 flex items-center justify-between bg-sidebar text-sidebar-foreground px-4 py-3">
        <div className="flex items-center gap-2"><img src="/logo.png" alt="Rocket" className="size-5 rounded object-cover" /><span className="font-display font-bold">Rocket</span></div>
        {dataProvider === "local" ? (
          <select value={db.currentUserId} onChange={(e) => update((d) => { d.currentUserId = e.target.value; })} className="rounded-md bg-sidebar-accent px-2 py-1 text-xs max-w-[55%]">
            {db.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs truncate max-w-[40vw] opacity-80">{user?.name}</span>
            <button onClick={() => void signOut()} className="rounded-md bg-sidebar-accent p-1.5 hover:bg-sidebar-primary/20 transition">
              <LogOut className="size-3.5" />
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 min-w-0 p-4 pb-24 md:p-8">{user && children}</main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 grid border-t bg-card" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {items.map((n) => (
          <Link key={n.to} to={n.to} className={cn("flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium", active(n.to) ? "text-primary" : "text-muted-foreground")}>
            <n.icon className="size-5" /> {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div><h1 className="text-2xl md:text-3xl font-bold">{title}</h1>{subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}</div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function NoAccess() {
  return <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">Acesso restrito a Diretores.</div>;
}
