import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Github } from "lucide-react";
import { AuthShell, TextField } from "@/components/auth-shell";

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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/dashboard" });
        }}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Full name" placeholder="Alex Morgan" autoFocus />
          <TextField label="Handle" placeholder="alex" />
        </div>
        <TextField label="Work email" type="email" placeholder="you@company.dev" />
        <TextField label="Password" type="password" placeholder="At least 10 characters" />
        <label className="flex items-start gap-2 text-xs text-zinc-500">
          <input type="checkbox" defaultChecked className="mt-0.5 accent-brand" />
          <span>
            I agree to the <a className="underline">Terms</a> and{" "}
            <a className="underline">Privacy Policy</a>.
          </span>
        </label>
        <button
          type="submit"
          className="mt-2 inline-flex h-10 items-center justify-center rounded-md bg-brand text-sm font-medium text-brand-foreground hover:brightness-110"
        >
          Create account
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
