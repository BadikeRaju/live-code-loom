import { createFileRoute, Link } from "@tanstack/react-router";
import { Star, Plus, Filter, Grid2x2, List } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { workspaces, notifications } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — CoFlux" },
      { name: "description", content: "Your CoFlux workspaces, activity and invites." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Welcome */}
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-brand">
              Signed in · alex@halcyon.dev
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-100">
              Welcome back, Alex.
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              You have {notifications.filter((n) => n.unread).length} unread notifications and{" "}
              {workspaces.length} active workspaces.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-md bg-brand px-3.5 py-2 text-sm font-medium text-brand-foreground hover:brightness-110">
            <Plus className="size-4" /> New workspace
          </button>
        </div>

        {/* Stats row */}
        <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-zinc-800 bg-zinc-800 md:grid-cols-4">
          {[
            { label: "Workspaces", value: workspaces.length.toString(), foot: "3 owned · 3 joined" },
            { label: "Collaborators", value: "12", foot: "across all workspaces" },
            { label: "Commits · 30d", value: "148", foot: "+22% vs last month" },
            { label: "Snapshots", value: "1,206", foot: "auto & manual" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-1 bg-panel p-5">
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                {s.label}
              </span>
              <span className="text-2xl font-semibold text-zinc-100">{s.value}</span>
              <span className="text-[11px] text-zinc-500">{s.foot}</span>
            </div>
          ))}
        </div>

        {/* Workspaces */}
        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-medium text-zinc-100">Active workspaces</h2>
              <nav className="flex items-center gap-1 rounded-md border border-zinc-800 bg-panel p-0.5 text-xs">
                {["All", "Starred", "Shared", "Recent"].map((t, i) => (
                  <button
                    key={t}
                    className={
                      "rounded px-2.5 py-1 " +
                      (i === 0
                        ? "bg-zinc-800 text-zinc-100"
                        : "text-zinc-400 hover:text-zinc-200")
                    }
                  >
                    {t}
                  </button>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-800 bg-panel px-2.5 text-xs text-zinc-300 hover:bg-zinc-900">
                <Filter className="size-3.5" /> Filter
              </button>
              <div className="flex items-center gap-0.5 rounded-md border border-zinc-800 bg-panel p-0.5">
                <button className="grid size-6 place-items-center rounded bg-zinc-800 text-zinc-100">
                  <Grid2x2 className="size-3.5" />
                </button>
                <button className="grid size-6 place-items-center rounded text-zinc-500 hover:text-zinc-200">
                  <List className="size-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((w) => (
              <Link
                to="/workspace/$id"
                params={{ id: w.id }}
                key={w.id}
                className="group flex flex-col gap-4 rounded-xl border border-zinc-800 bg-panel p-5 transition-all hover:-translate-y-0.5 hover:border-zinc-700 hover:shadow-2xl hover:shadow-black/40"
              >
                <div className="flex items-start justify-between">
                  <div className="grid size-9 place-items-center rounded-md border border-zinc-800 bg-zinc-900 text-xs font-mono font-bold text-zinc-300 group-hover:text-brand">
                    {w.language.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex items-center gap-2">
                    {w.starred && <Star className="size-3.5 fill-amber-400 text-amber-400" />}
                    <span
                      className={
                        "rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest " +
                        (w.visibility === "Private"
                          ? "border-zinc-800 bg-zinc-900 text-zinc-500"
                          : "border-brand/20 bg-brand/10 text-brand")
                      }
                    >
                      {w.visibility}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="truncate font-mono text-sm font-medium text-zinc-100">
                    {w.name}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                    {w.description}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                  <div className="flex -space-x-1.5">
                    {w.members.slice(0, 4).map((m) => (
                      <span
                        key={m.id}
                        className={`grid size-6 place-items-center rounded-full ${m.color} text-[10px] font-bold text-zinc-950 ring-2 ring-panel`}
                        title={m.name}
                      >
                        {m.initials}
                      </span>
                    ))}
                    {w.members.length > 4 && (
                      <span className="grid size-6 place-items-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400 ring-2 ring-panel">
                        +{w.members.length - 4}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                    {w.updated}
                  </span>
                </div>
              </Link>
            ))}

            <button className="group flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-800 p-5 transition-colors hover:border-brand/40 hover:bg-brand/5">
              <span className="grid size-10 place-items-center rounded-full border border-zinc-700 bg-panel text-zinc-500 group-hover:text-brand">
                <Plus className="size-5" />
              </span>
              <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-100">
                Create workspace
              </span>
              <span className="max-w-[22ch] text-center text-[11px] text-zinc-600">
                Empty · from template · or clone a GitHub repository
              </span>
            </button>
          </div>
        </section>

        {/* Activity + notifications */}
        <section className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-panel md:col-span-2">
            <header className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
              <h2 className="text-sm font-medium text-zinc-100">Recent activity</h2>
              <a href="#" className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 hover:text-zinc-300">
                view all →
              </a>
            </header>
            <ul className="divide-y divide-zinc-800 text-sm">
              {[
                { who: "Alex Morgan", action: "pushed to", target: "mercury-api-gateway / main", when: "2m" },
                { who: "Jordan Lee", action: "commented on", target: "flux-ui-kit / Button.tsx:24", when: "18m" },
                { who: "Priya Shah", action: "created", target: "atlas-docs / RFC-0012.md", when: "1h" },
                { who: "Marcus Chen", action: "restored version v4 of", target: "orbit-schema-lab", when: "3h" },
                { who: "Alex Morgan", action: "invited Raju Kumar to", target: "helios-marketing", when: "yesterday" },
              ].map((a, i) => (
                <li key={i} className="flex items-start gap-3 px-5 py-3.5">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brand" />
                  <p className="min-w-0 flex-1 text-zinc-300">
                    <span className="font-medium text-zinc-100">{a.who}</span>{" "}
                    <span className="text-zinc-500">{a.action}</span>{" "}
                    <span className="font-mono text-zinc-300">{a.target}</span>
                  </p>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                    {a.when}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-panel">
            <header className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
              <h2 className="text-sm font-medium text-zinc-100">Notifications</h2>
              <span className="rounded-full bg-brand/15 px-1.5 py-0.5 font-mono text-[10px] text-brand">
                {notifications.filter((n) => n.unread).length} new
              </span>
            </header>
            <ul className="divide-y divide-zinc-800">
              {notifications.map((n) => (
                <li key={n.id} className="flex gap-3 px-5 py-3.5">
                  <span
                    className={
                      "mt-1.5 size-1.5 shrink-0 rounded-full " + (n.unread ? "bg-brand" : "bg-zinc-700")
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-100">{n.title}</p>
                    <p className="truncate text-xs text-zinc-500">{n.body}</p>
                  </div>
                  <span className="font-mono text-[10px] uppercase text-zinc-600">{n.when}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
