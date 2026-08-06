import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState, useRef, useEffect } from "react";
import {
  Bell,
  Search,
  Settings,
  Home,
  Star,
  Users2,
  Archive,
  Folders,
  Plus,
  X,
  Send,
} from "lucide-react";
import { LogoMark } from "./site-header";
import { useAuth } from "@/lib/auth-context";
import { API_URL } from "@/lib/config";

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);

  useEffect(() => {
    if (user && token) {
      Promise.all([
        fetch(`${API_URL}/api/workspaces`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      ])
      .then(([resW, resN]) => Promise.all([resW.json(), resN.json()]))
      .then(([dataW, dataN]) => {
        setWorkspaces(dataW || []);
        setNotifications(dataN || []);
      })
      .catch(console.error);
    }
  }, [user, token]);

  const unread = notifications.filter((n) => n.unread).length;

  const [showBell, setShowBell] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const bellRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setShowBell(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = () => setNotifications((n) => n.map((x) => ({ ...x, unread: false })));
  const markRead = async (id: string) => {
    setNotifications((n) => n.map((x) => x.id === id ? { ...x, unread: false } : x));
    try {
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const searchResults = searchQuery.trim()
    ? workspaces.filter(
        (w) =>
          w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="flex min-h-screen bg-background">
      {/* App sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-zinc-800 bg-surface lg:flex">
        <Link to="/" className="flex h-14 items-center gap-2 border-b border-zinc-800 px-4">
          <LogoMark />
          <span className="font-semibold text-foreground">CoFlux</span>
        </Link>
        <nav className="flex flex-col gap-0.5 p-2">
          <NavItem to="/dashboard" icon={Home} label="Dashboard" active={path === "/dashboard"} />
          <NavItem to="/dashboard" icon={Folders} label="Workspaces" count={workspaces.filter(w => !w.archived).length} />
          <NavItem
            to="/dashboard"
            icon={Star}
            label="Starred"
            count={workspaces.filter((w) => !w.archived && w.starred).length}
            onClick={() => {
              navigate({ to: "/dashboard" });
              // Dispatch a custom event that dashboard can pick up
              window.dispatchEvent(new CustomEvent("dashboard:filter", { detail: "Starred" }));
            }}
          />
          <NavItem
            to="/dashboard"
            icon={Users2}
            label="Shared with me"
            count={workspaces.filter((w) => !w.archived && w.members?.some((m: any) => m.userId === user?.id && m.role !== 'owner')).length}
            onClick={() => {
              navigate({ to: "/dashboard" });
              window.dispatchEvent(new CustomEvent("dashboard:filter", { detail: "Shared" }));
            }}
          />
          <NavItem
            to="/dashboard"
            icon={Archive}
            label="Archived"
            count={workspaces.filter(w => w.archived).length}
            onClick={() => {
              navigate({ to: "/dashboard" });
              window.dispatchEvent(new CustomEvent("dashboard:filter", { detail: "Archived" }));
            }}
          />
        </nav>

        <div className="mt-4 px-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
            Recent
          </span>
          <ul className="mt-2 flex flex-col gap-0.5">
            {workspaces.slice(0, 3).map((w) => (
              <li key={w.id}>
                <Link
                  to="/workspace/$id"
                  params={{ id: w.id }}
                  className="flex items-center gap-2 rounded px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                >
                  <span className="size-1.5 rounded-full bg-zinc-700" />
                  <span className="truncate">{w.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto border-t border-zinc-800 p-3">
          <Link
            to="/settings"
            className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
          >
            <Settings className="size-4" /> Settings
          </Link>
          {/* Clickable profile */}
          <Link
            to="/settings"
            className="mt-3 flex items-center gap-2 rounded-md border border-zinc-800 bg-panel p-2 hover:bg-zinc-900 transition-colors"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="size-7 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold text-zinc-950" style={{ backgroundColor: user?.color || "#10b981" }}>
                {user?.name?.slice(0, 2).toUpperCase() || "RB"}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-zinc-100">{user?.name || "Raju Badike"}</p>
              <p className="truncate text-[10px] text-zinc-500">{user?.email || "rajubadike@example.com"}</p>
            </div>
            <Settings className="size-3.5 text-zinc-600 shrink-0" />
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-800 bg-background/85 px-4 backdrop-blur">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Link to="/" className="flex items-center gap-2 lg:hidden">
              <LogoMark />
            </Link>
            {/* Search */}
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
                onFocus={() => setShowSearch(true)}
                onBlur={() => setTimeout(() => setShowSearch(false), 150)}
                placeholder="Search files, docs, people, messages…"
                className="h-9 w-full rounded-md border border-zinc-800 bg-panel pr-14 pl-9 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-700 focus:outline-none"
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
                ⌘K
              </kbd>
              {/* Search results dropdown */}
              {showSearch && searchQuery.trim() && (
                <div className="absolute left-0 right-0 top-11 z-50 rounded-lg border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-zinc-500">No results for "{searchQuery}"</div>
                  ) : (
                    <ul className="divide-y divide-zinc-800">
                      {searchResults.map((w) => (
                        <li key={w.id}>
                          <Link
                            to="/workspace/$id"
                            params={{ id: w.id }}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800 transition-colors"
                          >
                            <div className="grid size-7 shrink-0 place-items-center rounded-md border border-zinc-700 bg-zinc-800 text-[10px] font-mono font-bold text-zinc-300">
                              {w.language.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-sm font-medium text-zinc-100">{w.name}</p>
                              <p className="truncate text-xs text-zinc-500">{w.description}</p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Invite */}
            <button
              onClick={() => setShowInvite(true)}
              className="hidden h-8 items-center gap-1.5 rounded-md border border-zinc-800 bg-panel px-3 text-xs font-medium text-zinc-200 hover:bg-zinc-900 sm:inline-flex"
            >
              <Plus className="size-3.5" /> Invite
            </button>

            {/* Bell */}
            <div ref={bellRef} className="relative">
              <button
                onClick={() => setShowBell((v) => !v)}
                className="relative grid size-8 place-items-center rounded-md border border-zinc-800 bg-panel text-zinc-400 hover:text-zinc-100"
              >
                <Bell className="size-4" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-brand text-[9px] font-bold text-brand-foreground">
                    {unread}
                  </span>
                )}
              </button>
              {showBell && (
                <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">
                  <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                    <span className="text-sm font-semibold text-zinc-100">Notifications</span>
                    <button onClick={markAllRead} className="text-[10px] text-brand hover:underline">
                      Mark all read
                    </button>
                  </div>
                  <ul className="divide-y divide-zinc-800 max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <li
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className="flex gap-3 px-4 py-3 hover:bg-zinc-800 cursor-pointer transition-colors"
                      >
                        <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${n.unread ? "bg-brand" : "bg-zinc-700"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-100">{n.title}</p>
                          <p className="truncate text-xs text-zinc-500">{n.body}</p>
                        </div>
                        <span className="font-mono text-[10px] text-zinc-600 shrink-0">{n.when}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Profile avatar */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setShowProfile((v) => !v)}
                className={`grid size-8 place-items-center rounded-full ${!user?.avatar ? 'text-xs font-bold text-zinc-950' : ''} hover:ring-2 hover:ring-brand transition-all`}
                style={!user?.avatar ? { backgroundColor: user?.color || "#10b981" } : undefined}
                title={user?.name || "Raju Badike"}
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="size-full rounded-full object-cover" />
                ) : (
                  user?.name?.slice(0, 2).toUpperCase() || "RB"
                )}
              </button>
              {showProfile && (
                <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-zinc-800">
                    <p className="text-sm font-semibold text-zinc-100">{user?.name || "Raju Badike"}</p>
                    <p className="text-xs text-zinc-500">{user?.email || "rajubadike@example.com"}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                      onClick={() => setShowProfile(false)}
                    >
                      <Settings className="size-4" /> Settings
                    </Link>
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                      onClick={() => setShowProfile(false)}
                    >
                      <Folders className="size-4" /> Workspaces
                    </Link>
                    <div className="border-t border-zinc-800 mt-1 pt-1">
                      <Link
                        to="/login"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-rose-400 hover:bg-zinc-800 transition-colors"
                        onClick={() => {
                          setShowProfile(false);
                          logout();
                        }}
                      >
                        Sign out
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <InviteModal onClose={() => setShowInvite(false)} />
      )}
    </div>
  );
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const send = () => {
    if (!email.trim()) return;
    setSent(true);
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-zinc-700 bg-surface p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-100">Invite a collaborator</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200"><X className="size-4" /></button>
        </div>
        {sent ? (
          <p className="text-center text-sm text-emerald-400 py-4">✓ Invite sent to {email}</p>
        ) : (
          <>
            <input
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              type="email"
              className="mb-3 h-9 w-full rounded-md border border-zinc-700 bg-panel px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-brand focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button
              onClick={send}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-brand py-2 text-xs font-medium text-brand-foreground hover:brightness-110"
            >
              <Send className="size-3.5" /> Send invite
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function NavItem({
  to,
  icon: Icon,
  label,
  active,
  count,
  onClick,
}: {
  to: string;
  icon: typeof Home;
  label: string;
  active?: boolean;
  count?: number;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={
        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm " +
        (active
          ? "bg-zinc-900 text-zinc-100"
          : "text-zinc-400 hover:bg-zinc-900/70 hover:text-zinc-200")
      }
    >
      <Icon className="size-4" strokeWidth={1.75} />
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span className="font-mono text-[10px] text-zinc-500">{count}</span>
      )}
    </Link>
  );
}
