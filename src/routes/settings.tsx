import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Github, Trash2 } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — CoFlux" },
      { name: "description", content: "Manage your CoFlux profile, GitHub connection and appearance." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">Profile, connections and appearance.</p>

        <div className="mt-8 flex flex-col gap-6">
          <Section title="Profile" subtitle="How you appear across the workspace.">
            <div className="flex items-center gap-5">
              <div className="grid size-16 place-items-center rounded-full bg-emerald-500 text-lg font-bold text-zinc-950">
                AM
              </div>
              <div className="flex flex-col gap-2">
                <button className="inline-flex h-8 items-center rounded-md border border-zinc-800 bg-panel px-3 text-xs text-zinc-200 hover:bg-zinc-900">
                  Upload avatar
                </button>
                <span className="text-[11px] text-zinc-500">PNG or JPG · max 2 MB</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Display name" value="Alex Morgan" />
              <Field label="Handle" value="alex" prefix="@" />
              <Field label="Email" value="alex@halcyon.dev" type="email" />
              <Field label="Timezone" value="Europe/London" />
            </div>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
              Bio
              <textarea
                defaultValue="Staff engineer @ Halcyon. Interested in distributed systems, type-safety and terrible puns."
                rows={3}
                className="rounded-md border border-zinc-800 bg-surface p-2.5 text-sm text-zinc-100 focus:border-brand focus:outline-none"
              />
            </label>
          </Section>

          <Section title="GitHub" subtitle="Push workspaces directly to your repositories.">
            <div className="flex items-center justify-between rounded-md border border-zinc-800 bg-surface p-4">
              <div className="flex items-center gap-3">
                <Github className="size-5 text-zinc-300" />
                <div>
                  <p className="text-sm font-medium text-zinc-100">Connected as @alex-morgan</p>
                  <p className="text-xs text-zinc-500">3 repositories linked · last push 2m ago</p>
                </div>
              </div>
              <button className="rounded-md border border-zinc-800 bg-panel px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-900">
                Disconnect
              </button>
            </div>
          </Section>

          <Section title="Appearance" subtitle="CoFlux is dark-first — for now.">
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: "Obsidian", active: true },
                { name: "Dim", active: false },
                { name: "System", active: false },
              ].map((t) => (
                <button
                  key={t.name}
                  className={
                    "flex flex-col gap-2 rounded-lg border p-3 text-left " +
                    (t.active
                      ? "border-brand/40 bg-brand/5"
                      : "border-zinc-800 bg-panel hover:border-zinc-700")
                  }
                >
                  <div className="aspect-video rounded bg-gradient-to-br from-zinc-800 to-zinc-950" />
                  <span className="text-xs font-medium text-zinc-200">{t.name}</span>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Security" subtitle="Password and two-factor authentication.">
            <div className="flex items-center justify-between rounded-md border border-zinc-800 bg-surface p-4">
              <div>
                <p className="text-sm font-medium text-zinc-100">Password</p>
                <p className="text-xs text-zinc-500">Last changed 42 days ago</p>
              </div>
              <button className="rounded-md border border-zinc-800 bg-panel px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-900">
                Change
              </button>
            </div>
            <div className="flex items-center justify-between rounded-md border border-zinc-800 bg-surface p-4">
              <div>
                <p className="text-sm font-medium text-zinc-100">Two-factor auth</p>
                <p className="text-xs text-zinc-500">Off · enable to protect commits and pushes</p>
              </div>
              <button className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground hover:brightness-110">
                Enable
              </button>
            </div>
          </Section>

          <Section
            title="Danger zone"
            subtitle="Irreversible destructive actions."
            danger
          >
            <div className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 p-4">
              <div>
                <p className="text-sm font-medium text-zinc-100">Delete account</p>
                <p className="text-xs text-zinc-500">
                  Removes all workspaces you own. Collaborators lose access immediately.
                </p>
              </div>
              <button className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/20">
                <Trash2 className="size-3.5" /> Delete
              </button>
            </div>
          </Section>
        </div>
      </div>
    </AppShell>
  );
}

function Section({
  title,
  subtitle,
  children,
  danger,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <section
      className={
        "rounded-xl border p-6 " +
        (danger ? "border-destructive/30 bg-destructive/[0.02]" : "border-zinc-800 bg-panel")
      }
    >
      <div className="mb-5">
        <h2 className={"text-base font-medium " + (danger ? "text-destructive" : "text-zinc-100")}>
          {title}
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  type = "text",
  prefix,
}: {
  label: string;
  value: string;
  type?: string;
  prefix?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
      {label}
      <div className="flex h-9 items-center rounded-md border border-zinc-800 bg-surface focus-within:border-brand">
        {prefix && <span className="pl-3 text-sm text-zinc-500">{prefix}</span>}
        <input
          type={type}
          defaultValue={value}
          className="flex-1 bg-transparent px-3 text-sm text-zinc-100 focus:outline-none"
        />
      </div>
    </label>
  );
}
