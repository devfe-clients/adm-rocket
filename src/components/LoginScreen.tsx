import { useState } from "react";
import { Rocket } from "lucide-react";
import { useAuth } from "@/services/auth";
import { Button } from "@/components/ui/button";

export function LoginScreen() {
  const { signIn, error, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try { await signIn(email, password); } catch { /* error já no contexto */ }
    finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Rocket className="size-8 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <img src="/logo.png" alt="Rocket Gestão" className="size-16 rounded-xl object-cover" />
          <h1 className="text-2xl font-bold font-display">Rocket Gestão</h1>
          <p className="text-sm text-muted-foreground">Acesso restrito à equipe Rocket</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">E-mail</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="seu@email.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Senha</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error.replace("Firebase: ", "").replace(/\(auth\/.*\)\.?/, "").trim() || "Credenciais inválidas"}
            </p>
          )}

           <Button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? "Entrando…" : "Entrar"}
           </Button>
        </form>

      </div>
    </div>
  );
}