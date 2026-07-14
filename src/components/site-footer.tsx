import { LogoMark } from "./site-header";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-zinc-900 bg-panel px-6 py-14">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-12 md:flex-row">
        <div className="flex max-w-sm flex-col gap-4">
          <div className="flex items-center gap-2">
            <LogoMark />
            <span className="font-semibold text-foreground">CoFlux</span>
          </div>
          <p className="text-sm leading-relaxed text-zinc-500">
            Distributed engineering for synchronous teams. Fast, reliable and integrated.
          </p>
          <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-zinc-600">
            <span className="size-1.5 animate-pulse rounded-full bg-brand" />
            All systems operational
          </div>
        </div>
        <div className="flex flex-col gap-10 sm:flex-row sm:gap-20">
          <FooterCol
            heading="Product"
            links={["Engine", "Real-time editor", "Docs editor", "GitHub Sync", "CLI"]}
          />
          <FooterCol
            heading="Resources"
            links={["Documentation", "Changelog", "Status", "Support", "Privacy"]}
          />
          <FooterCol
            heading="Company"
            links={["About", "Careers", "Security", "Contact"]}
          />
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-7xl border-t border-white/5 pt-8">
        <span className="font-mono text-[10px] uppercase text-zinc-700">
          © {new Date().getFullYear()} CoFlux Systems Inc. — frontend prototype
        </span>
      </div>
    </footer>
  );
}

function FooterCol({ heading, links }: { heading: string; links: string[] }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-bold uppercase tracking-widest text-zinc-600">{heading}</span>
      {links.map((l) => (
        <a key={l} href="#" className="text-sm text-zinc-400 transition-colors hover:text-zinc-100">
          {l}
        </a>
      ))}
    </div>
  );
}
