import { Link } from "@tanstack/react-router";
import { LogoMark } from "./site-header";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-2">
      <div className="flex flex-col justify-between p-8 lg:p-12">
        <Link to="/" className="flex items-center gap-2">
          <LogoMark />
          <span className="font-semibold text-foreground">CoFlux</span>
        </Link>

        <div className="mx-auto w-full max-w-sm py-16">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">{title}</h1>
          <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>

        <div className="text-xs text-zinc-500">{footer}</div>
      </div>

      <aside className="relative hidden overflow-hidden border-l border-zinc-900 bg-panel lg:block">
        <div className="grid-bg absolute inset-0 opacity-40" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <span className="font-mono text-[10px] uppercase tracking-widest text-brand">
            § Live from CoFlux
          </span>
          <blockquote className="max-w-md text-2xl font-medium leading-snug text-zinc-100">
            "We killed three chat tools and a wiki. CoFlux is where our team actually
            builds — code, docs and reviews in the same room."
          </blockquote>
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-emerald-500 text-xs font-bold text-zinc-950">
              AM
            </span>
            <div>
              <p className="text-sm font-medium text-zinc-100">Alex Morgan</p>
              <p className="text-xs text-zinc-500">Staff engineer, Halcyon Labs</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export function TextField({
  label,
  name,
  type = "text",
  placeholder,
  hint,
  autoFocus,
}: {
  label: string;
  name?: string;
  type?: string;
  placeholder?: string;
  hint?: ReactNode;
  autoFocus?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between text-xs font-medium text-zinc-400">
        {label}
        {hint}
      </span>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="h-10 rounded-md border border-zinc-800 bg-surface px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand focus:outline-none"
      />
    </label>
  );
}
