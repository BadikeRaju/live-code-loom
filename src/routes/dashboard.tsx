import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Star, Plus, Filter, Grid2x2, List, Search, X, Archive, UserPlus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — CoFlux" },
      { name: "description", content: "Your CoFlux workspaces, activity and invites." },
    ],
  }),
  component: Dashboard,
});

type FilterTab = "All" | "Starred" | "Shared" | "Recent" | "Archived";
type ViewMode = "grid" | "list";

function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterLang, setFilterLang] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isLoading, token } = useAuth();
  
  const [allWorkspaces, setAllWorkspaces] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (user && token) {
      Promise.all([
        fetch("http://localhost:1234/api/workspaces", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:1234/api/notifications", { headers: { Authorization: `Bearer ${token}` } })
      ])
        .then(([resW, resN]) => Promise.all([resW.json(), resN.json()]))
        .then(([dataW, dataN]) => {
          setAllWorkspaces(dataW || []);
          setNotifications(dataN || []);
          setDataLoading(false);
        })
        .catch(console.error);
    } else if (!isLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, isLoading, navigate, token]);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<FilterTab>;
      setActiveTab(customEvent.detail);
    };
    window.addEventListener("dashboard:filter", handler);
    return () => window.removeEventListener("dashboard:filter", handler);
  }, []);

  const sharedWorkspaces = allWorkspaces.filter((w) => w.members.some((m: any) => m.userId === user?.id && m.role !== 'owner'));
  const recentWorkspaces = allWorkspaces.slice(0, 3); // Todo: proper sorting

  const filteredWorkspaces = useMemo(() => {
    let list = allWorkspaces;
    
    if (activeTab === "Archived") list = list.filter((w) => w.archived);
    else list = list.filter((w) => !w.archived); // Exclude archived from other tabs
    
    if (activeTab === "Starred") list = list.filter((w) => w.starred);
    else if (activeTab === "Shared") list = sharedWorkspaces;
    else if (activeTab === "Recent") list = recentWorkspaces;
    
    if (filterLang) list = list.filter((w) => w.language === filterLang);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          (w.description || "").toLowerCase().includes(q) ||
          w.language.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allWorkspaces, activeTab, filterLang, searchQuery, sharedWorkspaces, recentWorkspaces]);

  const langs = Array.from(new Set(allWorkspaces.map((w) => w.language)));

  const toggleStar = async (e: React.MouseEvent, w: any) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await fetch(`http://localhost:1234/api/workspaces/${w.id}/star`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ starred: !w.starred })
      });
      setAllWorkspaces(prev => prev.map(ws => ws.id === w.id ? { ...ws, starred: !w.starred } : ws));
    } catch (err) { console.error(err); }
  };

  const toggleArchive = async (e: React.MouseEvent, w: any) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await fetch(`http://localhost:1234/api/workspaces/${w.id}/archive`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ archived: !w.archived })
      });
      setAllWorkspaces(prev => prev.map(ws => ws.id === w.id ? { ...ws, archived: !w.archived } : ws));
    } catch (err) { console.error(err); }
  };

  const handleShare = async (e: React.MouseEvent, w: any) => {
    e.preventDefault();
    e.stopPropagation();
    const email = window.prompt("Enter email to invite:");
    if (!email) return;
    try {
      const res = await fetch(`http://localhost:1234/api/workspaces/${w.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) alert(data.error);
      else alert("Shared successfully!");
    } catch (err) { console.error(err); }
  };

  const tabCounts: Record<FilterTab, number> = {
    All: allWorkspaces.filter(w => !w.archived).length,
    Starred: allWorkspaces.filter((w) => !w.archived && w.starred).length,
    Shared: sharedWorkspaces.filter(w => !w.archived).length,
    Recent: recentWorkspaces.filter(w => !w.archived).length,
    Archived: allWorkspaces.filter(w => w.archived).length,
  };

  if (isLoading || !user || dataLoading) {
    return <div className="flex h-screen items-center justify-center bg-background text-zinc-400 font-mono text-sm">Loading...</div>;
  }

  return (
    <AppShell>
      {showCreateModal && (
        <CreateWorkspaceModal
          onClose={() => setShowCreateModal(false)}
          onCreate={async (name, visibility, template) => {
            try {
              const res = await fetch("http://localhost:1234/api/workspaces", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name, language: "TypeScript", description: `Template: ${template}` })
              });
              if (!res.ok) throw new Error("Failed to create workspace");
              const newWs = await res.json();
              setShowCreateModal(false);
              navigate({ to: "/workspace/$id", params: { id: newWs.id } });
            } catch (err) {
              console.error(err);
              alert("Failed to create workspace");
            }
          }}
        />
      )}

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Welcome */}
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-brand">
              Signed in · {user?.email}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-100">
              Welcome back, {user?.name?.split(" ")[0] || "User"}.
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              You have {notifications.filter((n) => n.unread).length} unread notifications and{" "}
              {allWorkspaces.length} active workspaces.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-md bg-brand px-3.5 py-2 text-sm font-medium text-brand-foreground hover:brightness-110"
          >
            <Plus className="size-4" /> New workspace
          </button>
        </div>

        {/* Stats row */}
        <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-zinc-800 bg-zinc-800 md:grid-cols-4">
          {[
            { label: "Workspaces", value: allWorkspaces.length.toString(), foot: "3 owned · 3 joined" },
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
                {(["All", "Starred", "Shared", "Recent", "Archived"] as FilterTab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={
                      "rounded px-2.5 py-1 transition-colors flex items-center gap-1 " +
                      (activeTab === t
                        ? "bg-zinc-800 text-zinc-100"
                        : "text-zinc-400 hover:text-zinc-200")
                    }
                  >
                    {t}
                    <span className="font-mono text-[9px] text-zinc-600">{tabCounts[t]}</span>
                  </button>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-2">
              {/* Search workspaces */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search workspaces…"
                  className="h-8 w-44 rounded-md border border-zinc-800 bg-panel pl-8 pr-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none focus:w-56 transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200">
                    <X className="size-3" />
                  </button>
                )}
              </div>
              {/* Filter */}
              <div className="relative">
                <button
                  onClick={() => setFilterOpen((v) => !v)}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors ${filterLang ? "border-brand/40 bg-brand/10 text-brand" : "border-zinc-800 bg-panel text-zinc-300 hover:bg-zinc-900"}`}
                >
                  <Filter className="size-3.5" /> {filterLang ?? "Filter"}
                </button>
                {filterOpen && (
                  <div className="absolute right-0 top-10 z-20 min-w-32 rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl">
                    <button
                      onClick={() => { setFilterLang(null); setFilterOpen(false); }}
                      className={`flex w-full items-center px-3 py-1.5 text-xs hover:bg-zinc-800 ${!filterLang ? "text-brand" : "text-zinc-300"}`}
                    >
                      All languages
                    </button>
                    {langs.map((l) => (
                      <button
                        key={l}
                        onClick={() => { setFilterLang(l); setFilterOpen(false); }}
                        className={`flex w-full items-center px-3 py-1.5 text-xs hover:bg-zinc-800 ${filterLang === l ? "text-brand" : "text-zinc-300"}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* View toggle */}
              <div className="flex items-center gap-0.5 rounded-md border border-zinc-800 bg-panel p-0.5">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`grid size-6 place-items-center rounded transition-colors ${viewMode === "grid" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-200"}`}
                >
                  <Grid2x2 className="size-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`grid size-6 place-items-center rounded transition-colors ${viewMode === "list" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-200"}`}
                >
                  <List className="size-3.5" />
                </button>
              </div>
            </div>
          </div>

          {filteredWorkspaces.length === 0 ? (
            <div className="mt-10 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-800 py-16 text-center">
              <Search className="size-8 text-zinc-700" />
              <p className="text-sm font-medium text-zinc-400">No workspaces found</p>
              <p className="text-xs text-zinc-600">Try a different filter or search term</p>
              <button
                onClick={() => { setActiveTab("All"); setFilterLang(null); setSearchQuery(""); }}
                className="mt-1 rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900"
              >
                Clear filters
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredWorkspaces.map((w) => (
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
                      <button onClick={(e) => handleShare(e, w)} className="text-zinc-500 hover:text-brand transition-colors"><UserPlus className="size-4" /></button>
                      <button onClick={(e) => toggleArchive(e, w)} className="text-zinc-500 hover:text-amber-500 transition-colors"><Archive className="size-4" /></button>
                      <button onClick={(e) => toggleStar(e, w)} className="text-zinc-500 hover:text-amber-400 transition-colors">
                        <Star className={`size-4 ${w.starred ? "fill-amber-400 text-amber-400" : ""}`} />
                      </button>
                      <span
                        className={
                          "rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest " +
                          (w.visibility === "Private"
                            ? "border-zinc-800 bg-zinc-900 text-zinc-500"
                            : "border-brand/20 bg-brand/10 text-brand")
                        }
                      >
                        {w.visibility || "Private"}
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
                      {w.members.slice(0, 4).map((m: any) => (
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

              <button
                onClick={() => setShowCreateModal(true)}
                className="group flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-800 p-5 transition-colors hover:border-brand/40 hover:bg-brand/5"
              >
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
          ) : (
            /* List view */
            <div className="mt-5 flex flex-col divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-panel overflow-hidden">
              {filteredWorkspaces.map((w) => (
                <Link
                  to="/workspace/$id"
                  params={{ id: w.id }}
                  key={w.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="grid size-8 shrink-0 place-items-center rounded-md border border-zinc-800 bg-zinc-900 text-[10px] font-mono font-bold text-zinc-300 group-hover:text-brand">
                    {w.language.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-mono text-sm font-medium text-zinc-100">{w.name}</p>
                    <p className="truncate text-xs text-zinc-500">{w.description}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button onClick={(e) => handleShare(e, w)} className="text-zinc-500 hover:text-brand transition-colors opacity-0 group-hover:opacity-100"><UserPlus className="size-4" /></button>
                    <button onClick={(e) => toggleArchive(e, w)} className="text-zinc-500 hover:text-amber-500 transition-colors opacity-0 group-hover:opacity-100"><Archive className="size-4" /></button>
                    <button onClick={(e) => toggleStar(e, w)} className="text-zinc-500 hover:text-amber-400 transition-colors">
                      <Star className={`size-4 ${w.starred ? "fill-amber-400 text-amber-400" : ""}`} />
                    </button>
                    <span className="font-mono text-[10px] text-zinc-600">
                      {new Date(w.updatedAt).toLocaleDateString()}
                    </span>
                    <div className="flex -space-x-1.5">
                      {w.members.slice(0, 3).map((m: any) => (
                        <span key={m.id} className={`grid size-5 place-items-center rounded-full ${m.color} text-[9px] font-bold text-zinc-950 ring-1 ring-panel`} title={m.name}>
                          {m.initials}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-brand/5 transition-colors text-zinc-500 hover:text-brand"
              >
                <Plus className="size-4" />
                <span className="text-sm">Create new workspace…</span>
              </button>
            </div>
          )}
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
                <li key={n.id} className="flex gap-3 px-5 py-3.5 hover:bg-white/[0.02] cursor-pointer">
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

/* ---- Create Workspace Modal ---- */
function CreateWorkspaceModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, visibility: "Public" | "Private", template: string) => void;
}) {
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<"Public" | "Private">("Private");
  const [template, setTemplate] = useState("Empty");
  const [error, setError] = useState("");

  const TEMPLATES = ["Empty", "TypeScript API", "React App", "Documentation", "SQL Schema"];

  const submit = () => {
    if (!name.trim()) { setError("Workspace name is required"); return; }
    if (!/^[a-z0-9-]+$/.test(name.toLowerCase().replace(/\s+/g, "-"))) {
      setError("Use letters, numbers and hyphens only");
      return;
    }
    onCreate(name.trim(), visibility, template);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-surface p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-100">Create workspace</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200"><X className="size-4" /></button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
            Workspace name
            <input
              autoFocus
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="my-awesome-project"
              className="h-9 rounded-md border border-zinc-700 bg-panel px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            {error && <span className="text-rose-400">{error}</span>}
            {name && <span className="text-zinc-600">coflux.dev/{name.toLowerCase().replace(/\s+/g, "-")}</span>}
          </label>

          {/* Visibility */}
          <div className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
            Visibility
            <div className="grid grid-cols-2 gap-2">
              {(["Private", "Public"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setVisibility(v)}
                  className={`rounded-md border py-2 text-xs font-medium transition-colors ${visibility === v ? "border-brand bg-brand/10 text-brand" : "border-zinc-700 text-zinc-400 hover:border-zinc-600"}`}
                >
                  {v === "Private" ? "🔒 Private" : "🌐 Public"}
                </button>
              ))}
            </div>
          </div>

          {/* Template */}
          <div className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
            Start from
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTemplate(t)}
                  className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${template === t ? "border-brand bg-brand/10 text-brand" : "border-zinc-700 text-zinc-400 hover:border-zinc-600"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-md border border-zinc-700 py-2 text-xs text-zinc-300 hover:bg-zinc-800">
            Cancel
          </button>
          <button
            onClick={submit}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-brand py-2 text-xs font-medium text-brand-foreground hover:brightness-110"
          >
            <Plus className="size-3.5" /> Create workspace
          </button>
        </div>
      </div>
    </div>
  );
}
