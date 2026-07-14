import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  File as FileIcon,
  FileText,
  Folder,
  FolderOpen,
  Github,
  Download,
  Plus,
  Search,
  Settings,
  X,
  Users,
  MessageSquare,
  Activity as ActivityIcon,
  History,
  Circle,
  Send,
  Smile,
  Paperclip,
  RotateCcw,
  Reply,
  Check,
  ArrowLeft,
} from "lucide-react";
import {
  workspaces,
  fileTree,
  activity,
  messages,
  versionHistory,
  comments,
  members,
  type FileNode,
} from "@/lib/mock-data";
import { LogoMark } from "@/components/site-header";

export const Route = createFileRoute("/workspace/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} — CoFlux` },
      { name: "description", content: `Collaborate on ${params.id} in real time.` },
    ],
  }),
  loader: ({ params }) => {
    const ws = workspaces.find((w) => w.id === params.id);
    if (!ws) throw notFound();
    return { workspace: ws };
  },
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center bg-background text-center">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">Workspace not found</p>
        <Link to="/dashboard" className="mt-3 inline-block text-brand hover:underline">
          Back to dashboard
        </Link>
      </div>
    </div>
  ),
  component: WorkspacePage,
});

type Tab = { id: string; name: string; kind: "code" | "docs"; dirty?: boolean };

function WorkspacePage() {
  const { workspace } = Route.useLoaderData();
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "src/index.ts", name: "index.ts", kind: "code", dirty: true },
    { id: "docs/Architecture.md", name: "Architecture.md", kind: "docs" },
  ]);
  const [active, setActive] = useState<string>("src/index.ts");
  const [rightTab, setRightTab] = useState<"members" | "chat" | "activity" | "comments" | "history">(
    "chat",
  );
  const activeTab = tabs.find((t) => t.id === active) ?? tabs[0];

  const openFile = (node: FileNode) => {
    if (node.type !== "file") return;
    const kind: "code" | "docs" = node.language === "Markdown" ? "docs" : "code";
    setTabs((prev) =>
      prev.some((t) => t.id === node.id) ? prev : [...prev, { id: node.id, name: node.name, kind }],
    );
    setActive(node.id);
  };

  const closeTab = (id: string) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (active === id) setActive(next[next.length - 1]?.id ?? "");
      return next;
    });
  };

  return (
    <div className="flex h-screen min-h-screen flex-col overflow-hidden bg-background text-zinc-300">
      {/* Top bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-800 bg-surface px-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/dashboard"
            className="grid size-7 shrink-0 place-items-center rounded-md text-zinc-500 hover:bg-zinc-900 hover:text-zinc-100"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <LogoMark />
          </Link>
          <div className="ml-1 flex min-w-0 items-center gap-2 text-xs font-medium">
            <Link to="/dashboard" className="text-zinc-500 hover:text-zinc-300">Workspaces</Link>
            <span className="text-zinc-700">/</span>
            <span className="truncate font-mono text-zinc-100">{workspace.name}</span>
            <span className="ml-2 rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              {workspace.visibility}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 md:flex">
            <span className="text-[11px] text-zinc-500">Online</span>
            <div className="flex -space-x-1.5">
              {members
                .filter((m) => m.online)
                .map((m) => (
                  <span
                    key={m.id}
                    className={`grid size-6 place-items-center rounded-full ${m.color} text-[10px] font-bold text-zinc-950 ring-2 ring-surface`}
                    title={`${m.name} — ${m.role}`}
                  >
                    {m.initials}
                  </span>
                ))}
              <span className="grid size-6 place-items-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400 ring-2 ring-surface">
                +{members.filter((m) => !m.online).length}
              </span>
            </div>
          </div>
          <button className="hidden h-7 items-center gap-1.5 rounded-md border border-zinc-800 bg-panel px-2.5 text-xs text-zinc-200 hover:bg-zinc-900 sm:inline-flex">
            <Plus className="size-3.5" /> Invite
          </button>
          <button className="hidden h-7 items-center gap-1.5 rounded-md border border-zinc-800 bg-panel px-2.5 text-xs text-zinc-200 hover:bg-zinc-900 sm:inline-flex">
            <Download className="size-3.5" /> ZIP
          </button>
          <button className="inline-flex h-7 items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 text-xs font-medium text-zinc-900 hover:bg-white">
            <Github className="size-3.5" /> Push
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Left sidebar */}
        <LeftSidebar activeFile={active} onOpen={openFile} workspaceName={workspace.name} />

        {/* Editor area */}
        <main className="flex min-w-0 flex-1 flex-col bg-panel">
          <TabBar tabs={tabs} active={active} onSelect={setActive} onClose={closeTab} />
          <div className="min-h-0 flex-1 overflow-hidden">
            {activeTab ? (
              activeTab.kind === "code" ? (
                <CodeEditor filename={activeTab.name} />
              ) : (
                <DocsEditor filename={activeTab.name} />
              )
            ) : (
              <EmptyState />
            )}
          </div>
          <CommitBar />
        </main>

        {/* Right panel */}
        <RightPanel active={rightTab} onChange={setRightTab} />
      </div>

      {/* Status bar */}
      <footer className="flex h-6 shrink-0 items-center justify-between border-t border-zinc-800 bg-brand/[0.04] px-3 font-mono text-[10px] text-zinc-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-brand" /> Connected · yjs
          </span>
          <span className="hidden sm:inline">Auto-saved · 2s ago</span>
          <span className="hidden md:inline">{members.filter((m) => m.online).length} online</span>
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>LF</span>
          <span className="hidden sm:inline">{activeTab?.kind === "docs" ? "Markdown" : "TypeScript"}</span>
          <span className="hidden md:inline">Ln 3, Col 12</span>
          <span className="text-brand">main*</span>
        </div>
      </footer>
    </div>
  );
}

/* ----------------- Sidebar / File tree ----------------- */

function LeftSidebar({
  activeFile,
  onOpen,
  workspaceName,
}: {
  activeFile: string;
  onOpen: (n: FileNode) => void;
  workspaceName: string;
}) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <aside className="flex w-11 shrink-0 flex-col items-center gap-1 border-r border-zinc-800 bg-surface py-3">
        <SideIconBtn active label="Files" onClick={() => setCollapsed(false)}>
          <Folder className="size-4" />
        </SideIconBtn>
        <SideIconBtn label="Docs" onClick={() => setCollapsed(false)}>
          <FileText className="size-4" />
        </SideIconBtn>
        <SideIconBtn label="Search" onClick={() => setCollapsed(false)}>
          <Search className="size-4" />
        </SideIconBtn>
        <SideIconBtn label="Settings" onClick={() => setCollapsed(false)}>
          <Settings className="size-4" />
        </SideIconBtn>
      </aside>
    );
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-800 bg-surface md:flex">
      <div className="flex items-center justify-between px-3 pt-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Explorer</span>
        <button
          onClick={() => setCollapsed(true)}
          className="rounded p-1 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
          aria-label="Collapse sidebar"
        >
          <ChevronRight className="size-3.5 rotate-180" />
        </button>
      </div>

      <div className="mx-3 mt-3 truncate rounded-md border border-zinc-800 bg-panel px-2.5 py-1.5 font-mono text-xs text-zinc-300">
        {workspaceName}
      </div>

      <div className="mt-2 flex items-center gap-1 px-3">
        <button className="flex-1 rounded border border-zinc-800 bg-panel px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-900">
          + File
        </button>
        <button className="flex-1 rounded border border-zinc-800 bg-panel px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-900">
          + Folder
        </button>
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        <TreeList nodes={fileTree} depth={0} activeFile={activeFile} onOpen={onOpen} />
      </div>

      <div className="border-t border-zinc-800 p-3">
        <div className="rounded-md border border-zinc-800 bg-panel p-3">
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-500">
            <span>Git · main</span>
            <span className="text-brand">clean</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <Github className="size-3.5" />
            <span className="truncate font-mono">coflux/{workspaceName}</span>
          </div>
          <button className="mt-2 flex w-full items-center justify-center gap-1.5 rounded bg-brand py-1.5 text-[11px] font-medium text-brand-foreground hover:brightness-110">
            <Github className="size-3" /> Push to GitHub
          </button>
        </div>
      </div>
    </aside>
  );
}

function SideIconBtn({
  children,
  label,
  active,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={
        "grid size-8 place-items-center rounded-md " +
        (active ? "bg-zinc-900 text-brand" : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200")
      }
    >
      {children}
    </button>
  );
}

function TreeList({
  nodes,
  depth,
  activeFile,
  onOpen,
}: {
  nodes: FileNode[];
  depth: number;
  activeFile: string;
  onOpen: (n: FileNode) => void;
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      {nodes.map((n) => (
        <TreeNode key={n.id} node={n} depth={depth} activeFile={activeFile} onOpen={onOpen} />
      ))}
    </ul>
  );
}

function TreeNode({
  node,
  depth,
  activeFile,
  onOpen,
}: {
  node: FileNode;
  depth: number;
  activeFile: string;
  onOpen: (n: FileNode) => void;
}) {
  const [open, setOpen] = useState(true);
  const isActive = node.id === activeFile;
  const isFolder = node.type === "folder";

  return (
    <li>
      <button
        onClick={() => (isFolder ? setOpen((o) => !o) : onOpen(node))}
        className={
          "flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-[13px] " +
          (isActive
            ? "bg-brand/10 text-brand"
            : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200")
        }
        style={{ paddingLeft: 6 + depth * 12 }}
      >
        {isFolder ? (
          <>
            {open ? (
              <ChevronDown className="size-3 shrink-0 text-zinc-600" />
            ) : (
              <ChevronRight className="size-3 shrink-0 text-zinc-600" />
            )}
            {open ? (
              <FolderOpen className="size-3.5 shrink-0 text-zinc-500" />
            ) : (
              <Folder className="size-3.5 shrink-0 text-zinc-500" />
            )}
          </>
        ) : (
          <>
            <span className="w-3" />
            {node.language === "Markdown" ? (
              <FileText className="size-3.5 shrink-0 text-zinc-500" />
            ) : (
              <FileIcon className="size-3.5 shrink-0 text-zinc-500" />
            )}
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {isFolder && open && node.children && (
        <TreeList nodes={node.children} depth={depth + 1} activeFile={activeFile} onOpen={onOpen} />
      )}
    </li>
  );
}

/* ----------------- Tabs ----------------- */

function TabBar({
  tabs,
  active,
  onSelect,
  onClose,
}: {
  tabs: Tab[];
  active: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}) {
  return (
    <div className="flex h-9 shrink-0 items-stretch overflow-x-auto border-b border-zinc-800 bg-surface">
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <div
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={
              "group flex min-w-fit cursor-pointer items-center gap-2 border-r border-zinc-800 px-3 text-xs " +
              (isActive ? "bg-panel text-zinc-100" : "text-zinc-500 hover:text-zinc-300")
            }
          >
            {t.kind === "docs" ? (
              <FileText className="size-3.5 text-zinc-500" />
            ) : (
              <FileIcon className="size-3.5 text-zinc-500" />
            )}
            <span className={isActive ? "text-brand" : ""}>{t.name}</span>
            {t.dirty && <span className="size-1.5 rounded-full bg-brand" />}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(t.id);
              }}
              className="rounded p-0.5 text-zinc-600 opacity-0 hover:bg-zinc-800 hover:text-zinc-200 group-hover:opacity-100"
              aria-label="Close tab"
            >
              <X className="size-3" />
            </button>
          </div>
        );
      })}
      <button className="grid w-9 place-items-center text-zinc-600 hover:text-zinc-300">
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

/* ----------------- Editors ----------------- */

const codeLines: { tokens: Array<{ text: string; c?: string }>; cursor?: { name: string; color: string } }[] = [
  { tokens: [{ text: "import ", c: "text-syntax-keyword" }, { text: "{ Router } " }, { text: "from ", c: "text-syntax-keyword" }, { text: "\"express\"", c: "text-syntax-string" }, { text: ";" }] },
  { tokens: [{ text: "import ", c: "text-syntax-keyword" }, { text: "{ auth } " }, { text: "from ", c: "text-syntax-keyword" }, { text: "\"./middleware\"", c: "text-syntax-string" }, { text: ";" }] },
  { tokens: [{ text: "" }] },
  { tokens: [{ text: "// Real-time collaborative session initialised", c: "text-syntax-comment italic" }] },
  { tokens: [{ text: "const ", c: "text-syntax-keyword" }, { text: "router = " }, { text: "Router", c: "text-syntax-function" }, { text: "();" }], cursor: { name: "Alex", color: "bg-emerald-500" } },
  { tokens: [{ text: "" }] },
  { tokens: [{ text: "router" }, { text: "." }, { text: "use", c: "text-syntax-function" }, { text: "(" }, { text: "auth", c: "text-syntax-variable" }, { text: ");" }] },
  { tokens: [{ text: "" }] },
  { tokens: [{ text: "router" }, { text: "." }, { text: "get", c: "text-syntax-function" }, { text: "(" }, { text: "\"/health\"", c: "text-syntax-string" }, { text: ", (req, res) => {" }] },
  { tokens: [{ text: "  return res." }, { text: "status", c: "text-syntax-function" }, { text: "(" }, { text: "200", c: "text-syntax-number" }, { text: ")." }, { text: "send", c: "text-syntax-function" }, { text: "({ status: " }, { text: "\"up\"", c: "text-syntax-string" }, { text: " });" }], cursor: { name: "Jordan", color: "bg-sky-500" } },
  { tokens: [{ text: "});" }] },
  { tokens: [{ text: "" }] },
  { tokens: [{ text: "export default ", c: "text-syntax-keyword" }, { text: "router;" }] },
];

function CodeEditor({ filename }: { filename: string }) {
  return (
    <div className="relative flex h-full overflow-hidden bg-panel font-mono text-[13px] leading-6">
      {/* Gutter */}
      <div className="w-12 shrink-0 border-r border-zinc-800/50 bg-surface/40 py-4 text-right text-zinc-700">
        {codeLines.map((_, i) => (
          <div key={i} className="px-3">
            {i + 1}
          </div>
        ))}
      </div>
      {/* Code */}
      <div className="min-w-0 flex-1 overflow-auto py-4">
        {codeLines.map((line, i) => (
          <div key={i} className="group relative flex items-center px-4 hover:bg-white/[0.015]">
            <pre className="whitespace-pre text-zinc-100">
              {line.tokens.map((t, j) => (
                <span key={j} className={t.c ?? "text-zinc-100"}>
                  {t.text}
                </span>
              ))}
            </pre>
            {line.cursor && (
              <span
                className={`ml-1 inline-block h-5 w-0.5 align-middle ${line.cursor.color} cursor-blink`}
              >
                <span
                  className={`relative -top-4 left-0.5 inline-block rounded-sm px-1 text-[9px] font-medium text-zinc-950 ${line.cursor.color}`}
                >
                  {line.cursor.name}
                </span>
              </span>
            )}
          </div>
        ))}
        <div className="mt-8 px-4 text-[10px] uppercase tracking-widest text-zinc-700">
          — end of {filename}
        </div>
      </div>
      {/* Minimap */}
      <div className="hidden w-16 shrink-0 border-l border-zinc-800/50 bg-surface/30 p-2 xl:block">
        {codeLines.map((line, i) => (
          <div key={i} className="mb-0.5 flex gap-0.5">
            {line.tokens.map((t, j) => (
              <span
                key={j}
                className={`h-0.5 ${t.c ?? "bg-zinc-500"}`}
                style={{ width: Math.min(20, Math.max(2, t.text.length)) }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function DocsEditor({ filename }: { filename: string }) {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-panel">
      {/* Toolbar */}
      <div className="flex h-9 shrink-0 items-center gap-1 border-b border-zinc-800 bg-surface/50 px-3 text-xs text-zinc-400">
        {["H1", "H2", "B", "I", "U", "•", "1.", "☐", "{ }", "❝", "🔗"].map((b, i) => (
          <button
            key={i}
            className="rounded px-2 py-1 hover:bg-zinc-800 hover:text-zinc-100"
          >
            {b}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> 3 editing
        </div>
      </div>
      {/* Doc content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <article className="mx-auto max-w-3xl px-10 py-12 text-[15px] leading-relaxed text-zinc-300">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            {filename} · draft
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-100">
            Gateway architecture
          </h1>
          <p className="mt-4 text-zinc-400">
            The mercury API gateway sits between our public edge and our internal
            services. It is intentionally boring — a router, a health probe, and a
            handful of well-tested middleware.
          </p>
          <h2 className="mt-10 text-xl font-semibold text-zinc-100">Responsibilities</h2>
          <ul className="mt-3 space-y-2 text-zinc-400">
            <li>▸ Terminate TLS and normalise incoming HTTP.</li>
            <li>▸ Enforce authentication via <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-100">auth</code> middleware.</li>
            <li>▸ Route requests to internal services by hostname.</li>
            <li>▸ Emit structured access logs for every request.</li>
          </ul>

          <div className="my-8 rounded-lg border border-zinc-800 bg-surface p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-brand">Note</p>
            <p className="mt-1 text-sm text-zinc-300">
              The gateway does not execute business logic. Anything that requires
              database access lives in a downstream service.
            </p>
          </div>

          <h2 className="mt-10 text-xl font-semibold text-zinc-100">Health checks</h2>
          <p className="mt-3 text-zinc-400 relative">
            The <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-100">/health</code>
            {" "}endpoint returns <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-100">{"{ status: \"up\" }"}</code>
            {" "}when the process is accepting connections.
            <span className="ml-1 inline-block h-4 w-0.5 align-middle bg-emerald-500 cursor-blink" />
            <span className="ml-1 rounded-sm bg-emerald-500 px-1 text-[9px] font-medium text-zinc-950">
              Alex
            </span>
          </p>

          <h2 className="mt-10 text-xl font-semibold text-zinc-100">Deployment</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-zinc-400">
            <li>Merge to <code className="font-mono text-zinc-200">main</code>.</li>
            <li>CI builds the image and pushes to the registry.</li>
            <li>Argo rolls out to <code className="font-mono text-zinc-200">gateway-prod</code>.</li>
          </ol>

          <p className="mt-10 text-sm text-zinc-500">
            Last edited by <span className="text-zinc-300">Priya Shah</span> · just now
          </p>
        </article>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid h-full place-items-center bg-panel text-center">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
          No open files
        </p>
        <p className="mt-3 text-sm text-zinc-400">Select a file from the explorer to start editing.</p>
      </div>
    </div>
  );
}

function CommitBar() {
  const [msg, setMsg] = useState("feat(router): wire /health check into gateway");
  return (
    <div className="flex h-10 shrink-0 items-center justify-between border-t border-zinc-800 bg-surface/60 px-3">
      <div className="flex items-center gap-3 text-xs">
        <span className="flex items-center gap-1.5 text-brand">
          <span className="size-1.5 animate-pulse rounded-full bg-brand" /> syncing
        </span>
        <span className="text-zinc-500">
          <span className="text-zinc-300">3</span> files changed ·{" "}
          <span className="text-brand">+42</span> <span className="text-rose-400">−11</span>
        </span>
      </div>
      <div className="flex flex-1 items-center gap-2 px-4">
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Commit message…"
          className="h-7 min-w-0 flex-1 rounded-md border border-zinc-800 bg-panel px-2.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-brand focus:outline-none"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <button className="rounded-md border border-zinc-800 bg-panel px-2.5 py-1 text-[11px] text-zinc-200 hover:bg-zinc-900">
          Commit
        </button>
        <button className="inline-flex items-center gap-1 rounded-md bg-brand px-2.5 py-1 text-[11px] font-medium text-brand-foreground hover:brightness-110">
          <Github className="size-3" /> Commit & push
        </button>
      </div>
    </div>
  );
}

/* ----------------- Right panel ----------------- */

function RightPanel({
  active,
  onChange,
}: {
  active: "members" | "chat" | "activity" | "comments" | "history";
  onChange: (t: any) => void;
}) {
  const tabs = [
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "members", label: "People", icon: Users },
    { id: "activity", label: "Activity", icon: ActivityIcon },
    { id: "comments", label: "Comments", icon: Circle },
    { id: "history", label: "History", icon: History },
  ] as const;

  return (
    <aside className="hidden w-80 shrink-0 flex-col border-l border-zinc-800 bg-surface lg:flex">
      <div className="flex shrink-0 border-b border-zinc-800">
        {tabs.map((t) => {
          const isActive = t.id === active;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              title={t.label}
              className={
                "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold uppercase tracking-widest " +
                (isActive
                  ? "border-b-2 border-brand text-zinc-100"
                  : "border-b-2 border-transparent text-zinc-500 hover:text-zinc-300")
              }
            >
              <t.icon className="size-3.5" />
              <span className="hidden xl:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {active === "chat" && <ChatPanel />}
        {active === "members" && <MembersPanel />}
        {active === "activity" && <ActivityPanel />}
        {active === "comments" && <CommentsPanel />}
        {active === "history" && <HistoryPanel />}
      </div>
    </aside>
  );
}

function ChatPanel() {
  const [draft, setDraft] = useState("");
  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <div className="text-center font-mono text-[10px] uppercase tracking-widest text-zinc-600">
          — today —
        </div>
        {messages.map((m) => (
          <div key={m.id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`grid size-5 place-items-center rounded-full ${m.author.color} text-[9px] font-bold text-zinc-950`}
                >
                  {m.author.initials}
                </span>
                <span className="text-xs font-semibold text-zinc-100">{m.author.name}</span>
              </div>
              <span className="font-mono text-[10px] text-zinc-600">{m.time}</span>
            </div>
            <p className="ml-7 rounded-md bg-white/5 p-2 text-xs leading-relaxed text-zinc-300">
              {m.body}
            </p>
          </div>
        ))}
        <div className="ml-7 flex items-center gap-2 text-[11px] text-zinc-500">
          <span className="flex gap-0.5">
            <span className="size-1 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.3s]" />
            <span className="size-1 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.15s]" />
            <span className="size-1 animate-bounce rounded-full bg-zinc-500" />
          </span>
          Priya is typing…
        </div>
      </div>
      <div className="shrink-0 border-t border-zinc-800 p-3">
        <div className="rounded-md border border-zinc-800 bg-panel focus-within:border-zinc-700">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message the workspace… ⌘⏎ to send"
            className="w-full resize-none bg-transparent p-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
            rows={2}
          />
          <div className="flex items-center justify-between border-t border-zinc-800/60 px-2 py-1.5">
            <div className="flex items-center gap-1 text-zinc-500">
              <button className="rounded p-1 hover:bg-zinc-800 hover:text-zinc-200">
                <Paperclip className="size-3.5" />
              </button>
              <button className="rounded p-1 hover:bg-zinc-800 hover:text-zinc-200">
                <Smile className="size-3.5" />
              </button>
            </div>
            <button className="inline-flex items-center gap-1 rounded bg-brand px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-foreground hover:brightness-110">
              Send <Send className="size-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MembersPanel() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-zinc-800 p-3">
        <button className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-zinc-800 bg-panel py-1.5 text-xs text-zinc-200 hover:bg-zinc-900">
          <Plus className="size-3.5" /> Invite by email
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          Online — {members.filter((m) => m.online).length}
        </div>
        {members.filter((m) => m.online).map((m) => (
          <MemberRow key={m.id} member={m} />
        ))}
        <div className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          Offline — {members.filter((m) => !m.online).length}
        </div>
        {members.filter((m) => !m.online).map((m) => (
          <MemberRow key={m.id} member={m} />
        ))}
      </div>
    </div>
  );
}

function MemberRow({ member }: { member: typeof members[number] }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02]">
      <div className="relative">
        <span
          className={`grid size-8 place-items-center rounded-full ${member.color} text-xs font-bold text-zinc-950`}
        >
          {member.initials}
        </span>
        <span
          className={
            "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-surface " +
            (member.online ? "bg-emerald-500" : "bg-zinc-600")
          }
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-100">{member.name}</p>
        <p className="truncate font-mono text-[10px] text-zinc-500">@{member.handle}</p>
      </div>
      <span
        className={
          "rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest " +
          (member.role === "Owner"
            ? "border-brand/30 bg-brand/10 text-brand"
            : "border-zinc-800 bg-zinc-900 text-zinc-500")
        }
      >
        {member.role}
      </span>
    </div>
  );
}

function ActivityPanel() {
  return (
    <div className="h-full overflow-y-auto p-4">
      <ol className="relative border-l border-zinc-800 pl-4">
        {activity.map((a) => (
          <li key={a.id} className="mb-5 last:mb-0">
            <span className="absolute -left-1 mt-1.5 size-1.5 rounded-full bg-brand ring-4 ring-surface" />
            <p className="text-xs leading-relaxed text-zinc-300">
              <span className="font-medium text-zinc-100">{a.who}</span>{" "}
              <span className="text-zinc-500">{a.action}</span>{" "}
              <span className="font-mono text-zinc-300">{a.target}</span>
            </p>
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
              {a.when}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function CommentsPanel() {
  const grouped = useMemo(() => {
    return {
      open: comments.filter((c) => !c.resolved),
      resolved: comments.filter((c) => c.resolved),
    };
  }, []);

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-zinc-800 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
        Open — {grouped.open.length}
      </div>
      {grouped.open.map((c) => (
        <CommentCard key={c.id} c={c} />
      ))}
      <div className="border-y border-zinc-800 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
        Resolved — {grouped.resolved.length}
      </div>
      {grouped.resolved.map((c) => (
        <CommentCard key={c.id} c={c} muted />
      ))}
    </div>
  );
}

function CommentCard({ c, muted }: { c: typeof comments[number]; muted?: boolean }) {
  return (
    <div className={"border-b border-zinc-800 p-4 " + (muted ? "opacity-60" : "")}>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] text-zinc-500">
          {c.file}:{c.line}
        </span>
        {c.resolved ? (
          <span className="inline-flex items-center gap-1 rounded bg-brand/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-brand">
            <Check className="size-2.5" /> Resolved
          </span>
        ) : (
          <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-amber-400">
            Open
          </span>
        )}
      </div>
      <div className="flex items-start gap-2.5">
        <span
          className={`grid size-6 shrink-0 place-items-center rounded-full ${c.author.color} text-[10px] font-bold text-zinc-950`}
        >
          {c.author.initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-100">{c.author.name}</span>
            <span className="font-mono text-[10px] text-zinc-600">{c.when}</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-zinc-300">{c.body}</p>
          {!c.resolved && (
            <div className="mt-2.5 flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              <button className="inline-flex items-center gap-1 hover:text-zinc-200">
                <Reply className="size-3" /> Reply
              </button>
              <button className="inline-flex items-center gap-1 hover:text-brand">
                <Check className="size-3" /> Resolve
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryPanel() {
  return (
    <div className="h-full overflow-y-auto">
      {versionHistory.map((v, i) => (
        <div
          key={v.id}
          className={
            "group flex items-start gap-3 border-b border-zinc-800 p-4 " +
            (i === 0 ? "bg-brand/[0.03]" : "")
          }
        >
          <div className="mt-1 flex flex-col items-center">
            <span
              className={
                "grid size-2.5 place-items-center rounded-full " +
                (i === 0 ? "bg-brand" : "bg-zinc-700")
              }
            />
            {i < versionHistory.length - 1 && <span className="mt-1 h-8 w-px bg-zinc-800" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-zinc-100">{v.label}</span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                {v.when}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-zinc-400">{v.note}</p>
            <p className="mt-0.5 font-mono text-[10px] text-zinc-500">by {v.author}</p>
            <button className="mt-2 inline-flex items-center gap-1 rounded border border-zinc-800 bg-panel px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 opacity-0 hover:bg-zinc-900 hover:text-zinc-100 group-hover:opacity-100">
              <RotateCcw className="size-2.5" /> Restore
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
