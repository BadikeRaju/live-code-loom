import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Code2,
  FileText,
  GitBranch,
  MessageSquare,
  Users,
  History,
  Github,
  Download,
  Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-zinc-300 selection:bg-brand/30">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden px-6 pt-20 pb-16 md:pt-28">
        <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] opacity-60" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-8">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-brand">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-brand" />
            </span>
            Live collab · v2.0 beta
          </div>

          <h1 className="max-w-[20ch] text-balance text-4xl font-semibold tracking-tight text-zinc-100 md:text-6xl">
            The synchronous engine for distributed engineering
          </h1>
          <p className="max-w-[52ch] text-pretty text-lg leading-relaxed text-zinc-400">
            Built for teams who write documentation as seriously as they write code.
            A unified environment for real-time collaboration — code, docs, chat and
            version history — without the friction of context switching.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 rounded-md bg-brand py-2 pr-3 pl-2 text-sm font-medium text-brand-foreground ring-1 ring-brand transition hover:brightness-110"
            >
              <span className="grid size-4 place-items-center rounded-sm bg-black/10 font-mono">+</span>
              Deploy workspace
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-panel px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-900"
            >
              View live demo
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#workflow"
              className="ml-2 font-mono text-xs uppercase tracking-widest text-zinc-500 hover:text-zinc-300"
            >
              → how it works
            </a>
          </div>
        </div>

        {/* Product preview */}
        <div className="relative mx-auto mt-20 max-w-7xl">
          <div className="absolute -inset-x-8 -inset-y-6 -z-10 rounded-[2rem] bg-gradient-to-b from-brand/10 to-transparent blur-3xl opacity-40" />
          <MockAppFrame />
        </div>
      </section>

      {/* LOGO STRIP */}
      <section className="border-y border-zinc-900 bg-zinc-950/50 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-6 font-mono text-xs uppercase tracking-widest text-zinc-600">
          <span className="text-zinc-500">Trusted by engineering teams at</span>
          {["Northwind", "Halcyon", "Volt Labs", "Meridian", "Sigma-9", "Argonaut"].map((n) => (
            <span key={n} className="text-zinc-500">
              {n}
            </span>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="engine" className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 flex flex-col gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-brand">§ 01 · Engine</span>
            <h2 className="max-w-[24ch] text-3xl font-semibold tracking-tight text-zinc-100 md:text-4xl">
              Everything a team needs to build together — nothing to run.
            </h2>
            <p className="max-w-[60ch] text-zinc-500">
              CoFlux is collaboration-first. We don't execute your code in the cloud —
              we make sure the moment you're ready to run it, it's already in Git.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-zinc-800 bg-zinc-800 md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="flex flex-col gap-4 bg-panel p-6 transition-colors hover:bg-zinc-900">
                <f.icon className="size-5 text-brand" strokeWidth={1.5} />
                <div>
                  <h3 className="font-medium text-zinc-100">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-500">{f.body}</p>
                </div>
                <span className="mt-auto font-mono text-[10px] uppercase tracking-widest text-zinc-700">
                  {f.kicker}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow" className="border-t border-zinc-900 bg-zinc-950/40 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 flex flex-col gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-brand">§ 02 · Workflow</span>
            <h2 className="max-w-[24ch] text-3xl font-semibold tracking-tight text-zinc-100 md:text-4xl">
              Collaborate in browser. Ship from your terminal.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {workflow.map((s, i) => (
              <div
                key={s.title}
                className="relative flex flex-col gap-3 rounded-lg border border-zinc-800 bg-panel p-5"
              >
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                  Step 0{i + 1}
                </span>
                <s.icon className="size-5 text-zinc-300" strokeWidth={1.5} />
                <h3 className="font-medium text-zinc-100">{s.title}</h3>
                <p className="text-sm text-zinc-500">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section id="integrations" className="px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-2">
          <div className="flex flex-col justify-center gap-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-brand">§ 03 · Integrations</span>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-100 md:text-4xl">
              Push to GitHub. Open in VS Code. Zero lock-in.
            </h2>
            <p className="max-w-[52ch] leading-relaxed text-zinc-500">
              Every workspace is a real repository. Commit and push from the browser,
              or download a ZIP and keep working in your favourite editor. Your team's
              work is always yours — instantly.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-panel px-3 py-1.5 text-sm text-zinc-300">
                <Github className="size-4" /> GitHub App
              </span>
              <span className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-panel px-3 py-1.5 text-sm text-zinc-300">
                <Download className="size-4" /> ZIP export
              </span>
              <span className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-panel px-3 py-1.5 text-sm text-zinc-300">
                <Code2 className="size-4" /> Open in VS Code
              </span>
            </div>
          </div>
          <CommitPreview />
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="border-t border-zinc-900 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-brand">§ 04 · Pricing</span>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-100 md:text-4xl">
              Flat, honest, per-seat.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={
                  "flex flex-col gap-6 rounded-xl border p-6 " +
                  (p.featured
                    ? "border-brand/40 bg-gradient-to-b from-brand/5 to-transparent"
                    : "border-zinc-800 bg-panel")
                }
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-zinc-100">{p.name}</h3>
                    {p.featured && (
                      <span className="rounded-full bg-brand/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-brand">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-zinc-500">{p.tagline}</p>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-semibold text-zinc-100">{p.price}</span>
                  <span className="text-sm text-zinc-500">/ user / month</span>
                </div>
                <ul className="flex flex-1 flex-col gap-2 text-sm text-zinc-400">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-brand" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={
                    "h-9 rounded-md text-sm font-medium " +
                    (p.featured
                      ? "bg-brand text-brand-foreground hover:brightness-110"
                      : "border border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800")
                  }
                >
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-2xl border border-zinc-800 bg-panel p-10 md:flex-row md:items-center">
          <div>
            <h3 className="max-w-[24ch] text-2xl font-semibold text-zinc-100 md:text-3xl">
              Stop pasting diffs into Slack. Start writing in the same room.
            </h3>
            <p className="mt-2 text-zinc-500">A workspace ready in under 30 seconds.</p>
          </div>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground hover:brightness-110"
          >
            <Sparkles className="size-4" /> Start free
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

/* ---------- pieces ---------- */

const features = [
  {
    icon: Code2,
    title: "Real-time code editor",
    body: "Monaco-powered editing with live cursors, shared selections and typing indicators. Multi-cursor, autocomplete and formatting included.",
    kicker: "Monaco · Yjs · Presence",
  },
  {
    icon: FileText,
    title: "Docs alongside code",
    body: "Google-Docs style rich text for architecture notes, RFCs and READMEs. Comments, mentions and suggestions built in.",
    kicker: "Tiptap · Comments · Mentions",
  },
  {
    icon: Users,
    title: "Presence & permissions",
    body: "See who's online, what they're editing and who owns each file. Role-based access for Owners, Editors and Viewers.",
    kicker: "RBAC · Live avatars",
  },
  {
    icon: MessageSquare,
    title: "Workspace chat",
    body: "A dedicated room per workspace with file attachments, mentions and emoji. Threaded replies coming soon.",
    kicker: "Realtime · Threaded",
  },
  {
    icon: History,
    title: "Version history",
    body: "Every save is a snapshot. Diff any two versions, restore in one click, or branch off to explore.",
    kicker: "Snapshots · Restore",
  },
  {
    icon: GitBranch,
    title: "GitHub-native",
    body: "Commit, push, pull, create repositories — right from the workspace. Download a ZIP and open the folder in VS Code any time.",
    kicker: "Octokit · Web + CLI",
  },
];

const workflow = [
  { icon: Users, title: "Invite your team", body: "Create a workspace, invite collaborators by email and set roles." },
  { icon: Code2, title: "Build together", body: "Edit code and docs in the same room with live cursors and chat." },
  { icon: GitBranch, title: "Commit & push", body: "Snapshot your work as a git commit and push to any GitHub repo." },
  { icon: Download, title: "Continue offline", body: "Clone or download the workspace and keep going in VS Code." },
];

const plans = [
  {
    name: "Solo",
    tagline: "For individual developers exploring the platform.",
    price: "$0",
    cta: "Start free",
    features: ["1 private workspace", "Unlimited public workspaces", "GitHub push", "Community support"],
  },
  {
    name: "Team",
    tagline: "For engineering teams shipping together.",
    price: "$12",
    cta: "Start 14-day trial",
    featured: true,
    features: [
      "Unlimited workspaces",
      "Real-time collab up to 50 seats",
      "Comments, suggestions & mentions",
      "90 days of version history",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    tagline: "Bring your own SSO and audit trail.",
    price: "Custom",
    cta: "Contact sales",
    features: [
      "SAML · SCIM · Audit logs",
      "Self-hosted deployment option",
      "Custom retention policies",
      "Dedicated support engineer",
    ],
  },
];

function MockAppFrame() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-panel shadow-2xl">
      {/* Titlebar */}
      <div className="flex h-9 items-center justify-between border-b border-zinc-800 bg-surface px-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-zinc-700" />
            <span className="size-2.5 rounded-full bg-zinc-700" />
            <span className="size-2.5 rounded-full bg-zinc-700" />
          </div>
          <div className="ml-2 flex items-center gap-2 rounded border border-zinc-800 bg-panel px-2 py-0.5 text-[11px] font-medium text-zinc-400">
            <span className="text-zinc-600">coflux.app</span>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-200">mercury-api-gateway</span>
          </div>
        </div>
        <div className="flex -space-x-1.5">
          <span className="grid size-5 place-items-center rounded-full bg-emerald-500 text-[9px] font-bold text-zinc-950 ring-2 ring-surface">AM</span>
          <span className="grid size-5 place-items-center rounded-full bg-sky-500 text-[9px] font-bold text-zinc-950 ring-2 ring-surface">JL</span>
          <span className="grid size-5 place-items-center rounded-full bg-fuchsia-500 text-[9px] font-bold text-zinc-950 ring-2 ring-surface">PS</span>
        </div>
      </div>

      <div className="grid grid-cols-12">
        {/* Sidebar */}
        <div className="col-span-3 border-r border-zinc-800 p-3 lg:col-span-2">
          <span className="mb-2 block px-1 font-mono text-[9px] uppercase tracking-widest text-zinc-600">Explorer</span>
          <ul className="space-y-1 text-xs">
            {[
              { name: "▾ src", muted: true },
              { name: "  index.ts", active: true },
              { name: "  middleware.ts" },
              { name: "  routes.ts" },
              { name: "▸ docs", muted: true },
              { name: "  Architecture.md" },
              { name: "package.json" },
              { name: "README.md" },
            ].map((f, i) => (
              <li
                key={i}
                className={
                  "truncate rounded px-2 py-1 " +
                  (f.active
                    ? "bg-brand/10 text-brand"
                    : f.muted
                    ? "text-zinc-500"
                    : "text-zinc-400")
                }
              >
                {f.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Editor */}
        <div className="col-span-9 flex flex-col lg:col-span-7">
          <div className="flex h-8 items-center border-b border-zinc-800 bg-surface text-xs">
            <div className="flex h-full items-center gap-2 border-r border-zinc-800 bg-panel px-3">
              <span className="size-1.5 rounded-full bg-brand" />
              <span className="text-zinc-100">index.ts</span>
              <span className="text-zinc-600">×</span>
            </div>
            <div className="flex h-full items-center gap-2 border-r border-zinc-800 px-3 text-zinc-500">
              Architecture.md<span className="text-zinc-700">×</span>
            </div>
          </div>
          <div className="flex-1 overflow-hidden p-5 font-mono text-[12.5px] leading-relaxed">
            <CodeLine n={1}>
              <K>import</K> {"{ Router } "}<K>from</K> <S>"express"</S>;
            </CodeLine>
            <CodeLine n={2}>
              <C>{"// Real-time — Alex is editing this line"}</C>
            </CodeLine>
            <CodeLine n={3} cursor="Alex" cursorColor="bg-emerald-500">
              <K>const</K> router = <Fn>Router</Fn>();
            </CodeLine>
            <CodeLine n={4}>&nbsp;</CodeLine>
            <CodeLine n={5}>
              router.<Fn>get</Fn>(<S>"/health"</S>, (req, res) {"=> {"}
            </CodeLine>
            <CodeLine n={6} cursor="Jordan" cursorColor="bg-sky-500" cursorLeft="left-40">
              &nbsp;&nbsp;res.<Fn>status</Fn>(<N>200</N>).<Fn>send</Fn>({"{ status: "}<S>"up"</S>{" }"});
            </CodeLine>
            <CodeLine n={7}>{"});"}</CodeLine>
            <CodeLine n={8}>&nbsp;</CodeLine>
            <CodeLine n={9}>
              <K>export default</K> router;
            </CodeLine>
          </div>
          <div className="flex h-6 items-center justify-between border-t border-zinc-800 bg-brand/5 px-3 font-mono text-[10px] text-zinc-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 animate-pulse rounded-full bg-brand" /> Connected
              </span>
              <span>TypeScript</span>
              <span>UTF-8</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Ln 3, Col 12</span>
              <span className="text-brand">main*</span>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="hidden border-l border-zinc-800 lg:col-span-3 lg:block">
          <div className="flex border-b border-zinc-800 text-[10px] font-bold uppercase tracking-widest">
            <span className="flex-1 border-b-2 border-brand py-2 text-center text-zinc-100">Chat</span>
            <span className="flex-1 py-2 text-center text-zinc-500">Activity</span>
          </div>
          <div className="space-y-4 p-3">
            <ChatBubble name="Alex M." color="text-emerald-400" time="14:02">
              I've added the health check route. Ready for review?
            </ChatBubble>
            <ChatBubble name="Jordan L." color="text-sky-400" time="14:05">
              Looks solid. Let's merge after lint passes.
            </ChatBubble>
            <ChatBubble name="Priya S." color="text-fuchsia-400" time="14:11">
              Left a note on <span className="font-mono text-zinc-200">middleware.ts:31</span>.
            </ChatBubble>
          </div>
        </div>
      </div>
    </div>
  );
}

function CodeLine({
  n,
  children,
  cursor,
  cursorColor,
  cursorLeft = "left-14",
}: {
  n: number;
  children: React.ReactNode;
  cursor?: string;
  cursorColor?: string;
  cursorLeft?: string;
}) {
  return (
    <div className="relative flex gap-4">
      <span className="w-6 shrink-0 text-right text-zinc-700">{n}</span>
      <span className="text-zinc-100">{children}</span>
      {cursor && (
        <span className={`absolute top-0 ${cursorLeft} h-5 w-0.5 ${cursorColor} cursor-blink`}>
          <span
            className={`absolute -top-4 left-0 rounded-sm px-1 text-[9px] font-medium text-zinc-950 whitespace-nowrap ${cursorColor}`}
          >
            {cursor}
          </span>
        </span>
      )}
    </div>
  );
}
const k = ({ children }: any) => <span className="text-syntax-keyword">{children}</span>;
const s = ({ children }: any) => <span className="text-syntax-string">{children}</span>;
const fn = ({ children }: any) => <span className="text-syntax-function">{children}</span>;
const c = ({ children }: any) => <span className="text-syntax-comment italic">{children}</span>;
const n = ({ children }: any) => <span className="text-syntax-number">{children}</span>;

function ChatBubble({
  name,
  color,
  time,
  children,
}: {
  name: string;
  color: string;
  time: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold ${color}`}>{name}</span>
        <span className="text-[10px] text-zinc-600">{time}</span>
      </div>
      <p className="rounded-md bg-white/5 p-2 text-xs text-zinc-300">{children}</p>
    </div>
  );
}

function CommitPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-panel">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Github className="size-4" />
          <span className="font-mono">coflux/mercury-api-gateway</span>
        </div>
        <span className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          main
        </span>
      </div>
      <div className="flex flex-col gap-3 p-4 font-mono text-xs">
        <div className="flex items-center gap-2 text-zinc-500">
          <span className="text-brand">+</span> 3 files changed · <span className="text-brand">+42</span>{" "}
          <span className="text-rose-400">-11</span>
        </div>
        <textarea
          rows={2}
          defaultValue="feat(router): wire /health check into gateway"
          className="w-full rounded-md border border-zinc-800 bg-surface p-2 text-zinc-200 focus:border-brand focus:outline-none"
        />
        <div className="grid grid-cols-2 gap-2">
          <button className="rounded-md border border-zinc-800 bg-zinc-900 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800">
            Commit
          </button>
          <button className="rounded-md bg-brand py-1.5 text-xs font-medium text-brand-foreground hover:brightness-110">
            Commit & push
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Last push · 2 minutes ago</span>
          <span className="flex items-center gap-1 text-brand">
            <span className="size-1.5 animate-pulse rounded-full bg-brand" /> Synced
          </span>
        </div>
      </div>
    </div>
  );
}
