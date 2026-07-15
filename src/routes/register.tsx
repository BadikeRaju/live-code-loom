import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Github } from "lucide-react";
import { AuthShell, TextField } from "@/components/auth-shell";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { API_URL } from "@/lib/config";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create your CoFlux account" },
      { name: "description", content: "Create a CoFlux account and spin up your first workspace." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const name = `${firstName} ${lastName}`.trim();
    const password = formData.get("password") as string;
    
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
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
      title="Create your account"
      subtitle="30 seconds to your first collaborative workspace."
      footer={
        <span>
          Already have one?{" "}
          <Link to="/login" className="text-zinc-200 underline underline-offset-4 hover:text-zinc-50">
            Sign in
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
        <div className="grid grid-cols-2 gap-3">
          <TextField name="firstName" label="First name" placeholder="Alex" autoFocus />
          <TextField name="lastName" label="Last name" placeholder="Morgan" />
        </div>
        <TextField name="email" label="Work email" type="email" placeholder="you@company.dev" />
        <TextField name="password" label="Password" type="password" placeholder="At least 10 characters" />
        <label className="flex items-start gap-2 text-xs text-zinc-500">
          <input type="checkbox" defaultChecked className="mt-0.5 accent-brand" />
          <span>
            I agree to the <a className="underline">Terms</a> and{" "}
            <a className="underline">Privacy Policy</a>.
          </span>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex h-10 items-center justify-center rounded-md bg-brand text-sm font-medium text-brand-foreground hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
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
