import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Github } from "lucide-react";
import { AuthShell, TextField } from "@/components/auth-shell";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — CoFlux" },
      { name: "description", content: "Sign in to your CoFlux workspace." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:1234/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }
      
      login(data.token, data.user);
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue to your workspaces."
      footer={
        <span>
          No account?{" "}
          <Link to="/register" className="text-zinc-200 underline underline-offset-4 hover:text-zinc-50">
            Create one
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
        <TextField name="email" label="Email" type="email" placeholder="you@company.dev" autoFocus />
        <TextField
          name="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          hint={
            <a href="#" className="text-[11px] text-zinc-500 hover:text-zinc-300">
              Forgot?
            </a>
          }
        />
        <label className="flex items-center gap-2 text-xs text-zinc-500">
          <input type="checkbox" defaultChecked className="accent-brand" /> Keep me signed in
        </label>
        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex h-10 items-center justify-center rounded-md bg-brand text-sm font-medium text-brand-foreground hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <div className="relative my-2 h-px bg-zinc-800">
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 font-mono text-[10px] uppercase tracking-widest text-zinc-600">
            or
          </span>
        </div>
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-800 bg-panel text-sm font-medium text-zinc-200 hover:bg-zinc-900"
        >
          <Github className="size-4" /> Continue with GitHub
        </button>
      </form>
    </AuthShell>
  );
}
