import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
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
} from "lucide-react";
import { LogoMark } from "./site-header";
import { notifications } from "@/lib/mock-data";

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const unread = notifications.filter((n) => n.unread).length;

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
          <NavItem to="/dashboard" icon={Folders} label="Workspaces" count={6} />
          <NavItem to="/dashboard" icon={Star} label="Starred" count={2} />
          <NavItem to="/dashboard" icon={Users2} label="Shared with me" count={4} />
          <NavItem to="/dashboard" icon={Archive} label="Archived" />
        </nav>

        <div className="mt-4 px-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
            Recent
          </span>
          <ul className="mt-2 flex flex-col gap-0.5">
            {["mercury-api-gateway", "flux-ui-kit", "atlas-docs"].map((w) => (
              <li key={w}>
                <Link
                  to="/workspace/$id"
                  params={{ id: w }}
                  className="flex items-center gap-2 rounded px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                >
                  <span className="size-1.5 rounded-full bg-zinc-700" />
                  <span className="truncate">{w}</span>
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
          <div className="mt-3 flex items-center gap-2 rounded-md border border-zinc-800 bg-panel p-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-500 text-[10px] font-bold text-zinc-950">
              AM
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-zinc-100">Alex Morgan</p>
              <p className="truncate text-[10px] text-zinc-500">alex@halcyon.dev</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-800 bg-background/85 px-4 backdrop-blur">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Link to="/" className="flex items-center gap-2 lg:hidden">
              <LogoMark />
            </Link>
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <input
                placeholder="Search files, docs, people, messages…"
                className="h-9 w-full rounded-md border border-zinc-800 bg-panel pr-14 pl-9 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-700 focus:outline-none"
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
                ⌘K
              </kbd>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="hidden h-8 items-center gap-1.5 rounded-md border border-zinc-800 bg-panel px-3 text-xs font-medium text-zinc-200 hover:bg-zinc-900 sm:inline-flex">
              <Plus className="size-3.5" /> Invite
            </button>
            <button className="relative grid size-8 place-items-center rounded-md border border-zinc-800 bg-panel text-zinc-400 hover:text-zinc-100">
              <Bell className="size-4" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-brand text-[9px] font-bold text-brand-foreground">
                  {unread}
                </span>
              )}
            </button>
            <div className="grid size-8 place-items-center rounded-full bg-emerald-500 text-xs font-bold text-zinc-950">
              AM
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
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
}: {
  to: string;
  icon: typeof Home;
  label: string;
  active?: boolean;
  count?: number;
}) {
  return (
    <Link
      to={to}
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
