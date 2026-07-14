import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <LogoMark />
            <span className="font-semibold tracking-tight text-foreground">CoFlux</span>
          </Link>
          <nav className="hidden gap-6 text-sm font-medium text-zinc-500 md:flex">
            <a href="/#engine" className="transition-colors hover:text-zinc-200">Engine</a>
            <a href="/#integrations" className="transition-colors hover:text-zinc-200">Integrations</a>
            <a href="/#workflow" className="transition-colors hover:text-zinc-200">Workflow</a>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100 sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 py-1.5 pr-3 pl-2 text-sm font-medium text-zinc-900 ring-1 ring-zinc-950/10 transition hover:bg-white"
          >
            <span className="grid size-4 place-items-center rounded-sm bg-zinc-900/10">
              <Plus className="size-3" />
            </span>
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={
        "grid size-6 place-items-center rounded-[6px] bg-gradient-to-br from-brand to-emerald-700 text-[10px] font-bold text-zinc-950 " +
        className
      }
      aria-hidden
    >
      C
    </span>
  );
}
