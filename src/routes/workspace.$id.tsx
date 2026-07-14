import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import { useAuth } from "@/lib/auth-context";
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
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  Link2,
  Heading1,
  Heading2,
  FolderPlus,
  FilePlus,
} from "lucide-react";
type FileNode = {
  name: string;
  type: "file" | "folder";
  id: string;
  language?: string;
  children?: FileNode[];
};

const fileTree: FileNode[] = [];
const activity: any[] = [];
const initialMessages: any[] = [];
const initialVersionHistory: any[] = [];
const initialComments: any[] = [];
import { LogoMark } from "@/components/site-header";

export const Route = createFileRoute("/workspace/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} — CoFlux` },
      { name: "description", content: `Collaborate on ${params.id} in real time.` },
    ],
  }),
  loader: ({ params }) => {
    return { workspaceId: params.id };
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
type Toast = { id: string; message: string; type: "success" | "error" | "info" };
type CommentType = typeof initialComments[number] & { replies?: string[] };

/* ---- Minimal toast system ---- */
function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = (message: string, type: Toast["type"] = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };
  return { toasts, show };
}

function WorkspacePage() {
  const { workspaceId } = Route.useLoaderData();
  const { token, user } = useAuth();
  const [workspace, setWorkspace] = useState<any>(null);

  useEffect(() => {
    if (token) {
      fetch(`http://localhost:1234/api/workspaces/${workspaceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => setWorkspace(data))
      .catch(console.error);
    }
  }, [token, workspaceId]);

  const { toasts, show } = useToast();

  if (!workspace) {
    return <div className="flex h-screen items-center justify-center bg-background text-zinc-400 font-mono text-sm">Loading workspace...</div>;
  }

  const [tabs, setTabs] = useState<Tab[]>([
    { id: "src/index.ts", name: "index.ts", kind: "code", dirty: true },
    { id: "docs/Architecture.md", name: "Architecture.md", kind: "docs" },
  ]);
  const [active, setActive] = useState<string>("src/index.ts");
  const [rightTab, setRightTab] = useState<"members" | "chat" | "activity" | "comments" | "history">("chat");
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const activeTab = tabs.find((t) => t.id === active) ?? tabs[0];

  // Comments state (mutable)
  const [comments, setComments] = useState<CommentType[]>(
    initialComments.map((c) => ({ ...c, replies: [] }))
  );

  // Version history state (mutable)
  const [versionHistory, setVersionHistory] = useState(initialVersionHistory);

  // File tree state (mutable for new file/folder)
  const [tree, setTree] = useState<FileNode[]>(fileTree);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);

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

  const addNewTab = () => {
    const id = `untitled-${Date.now()}.ts`;
    const newTab: Tab = { id, name: "untitled.ts", kind: "code", dirty: true };
    setTabs((prev) => [...prev, newTab]);
    setActive(id);
    show("New file created", "info");
  };

  // Push to GitHub
  const handlePush = () => {
    show("Pushing to GitHub…", "info");
    setTimeout(() => show("✓ Pushed to origin/main (3 commits)", "success"), 1500);
  };

  // ZIP download (simulated)
  const handleZip = () => {
    show("Preparing ZIP archive…", "info");
    setTimeout(() => {
      const a = document.createElement("a");
      a.href = "data:application/zip;base64,UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==";
      a.download = `${workspace.name}.zip`;
      a.click();
      show("✓ Download started", "success");
    }, 800);
  };

  const handleInvite = (email: string) => {
    setShowInviteModal(false);
    show(`Invited ${email} to ${workspace.name}`, "success");
  };

  // Commit
  const handleCommit = (msg: string, andPush: boolean) => {
    if (!msg.trim()) { show("Commit message is required", "error"); return; }
    show(`Committing: "${msg}"…`, "info");
    setTimeout(() => {
      const label = `v0.${14 + versionHistory.length}.${versionHistory.length}`;
      setVersionHistory((prev) => [
        { id: `v${Date.now()}`, label, author: "You", when: "just now", note: msg },
        ...prev,
      ]);
      setTabs((prev) => prev.map((t) => ({ ...t, dirty: false })));
      show(`✓ Committed as ${label}${andPush ? " and pushed" : ""}`, "success");
    }, 1000);
  };

  // Resolve comment
  const resolveComment = (id: string) => {
    setComments((prev) => prev.map((c) => c.id === id ? { ...c, resolved: true } : c));
    show("Comment resolved", "success");
  };

  // Reply to comment
  const replyToComment = (id: string, text: string) => {
    setComments((prev) => prev.map((c) =>
      c.id === id ? { ...c, replies: [...(c.replies ?? []), text] } : c
    ));
    show("Reply added", "success");
  };

  // Restore version
  const restoreVersion = (label: string) => {
    show(`Restoring ${label}…`, "info");
    setTimeout(() => show(`✓ Restored to ${label}`, "success"), 1200);
  };

  // Recursively add a node inside a parent folder (or root if no parentId)
  const addToTree = (name: string, type: "file" | "folder", parentId?: string) => {
    const lang = name.endsWith(".md") ? "Markdown" : name.endsWith(".json") ? "JSON" : "TypeScript";
    const id = parentId ? `${parentId}/${name}` : name;
    const newNode: FileNode = { id, name, type, language: type === "file" ? lang : undefined, children: type === "folder" ? [] : undefined };

    const insertInto = (nodes: FileNode[]): FileNode[] => {
      if (!parentId) return [...nodes, newNode];
      return nodes.map((n) => {
        if (n.id === parentId && n.type === "folder") {
          return { ...n, children: [...(n.children ?? []), newNode] };
        }
        if (n.children) return { ...n, children: insertInto(n.children) };
        return n;
      });
    };

    setTree((prev) => insertInto(prev));
    if (type === "file") {
      const kind: "code" | "docs" = lang === "Markdown" ? "docs" : "code";
      setTabs((prev) => [...prev, { id, name, kind, dirty: true }]);
      setActive(id);
    }
    show(`✓ Created ${type} "${name}"`, "success");
  };

  return (
    <div className="flex h-screen min-h-screen flex-col overflow-hidden bg-background text-zinc-300">
      {/* Toast notifications */}
      <div className="fixed bottom-8 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium shadow-xl border transition-all
              ${t.type === "success" ? "bg-emerald-950 border-emerald-700 text-emerald-200" :
                t.type === "error" ? "bg-rose-950 border-rose-700 text-rose-200" :
                  "bg-zinc-900 border-zinc-700 text-zinc-200"}`}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Invite modal */}
      {showInviteModal && (
        <InviteModal onClose={() => setShowInviteModal(false)} onInvite={(email) => {
          setShowInviteModal(false);
          show(`Invite sent to ${email}`, "success");
        }} />
      )}

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
            <span className="text-[11px] text-zinc-500">Members</span>
            <div className="flex -space-x-1.5 px-3">
              {workspace.members && workspace.members.slice(0, 3).map((m: any) => (
                <span
                  key={m.id}
                  className={`grid size-6 place-items-center rounded-full bg-zinc-700 text-[10px] font-bold text-zinc-200 ring-2 ring-surface`}
                  title={m.user?.name}
                >
                  {m.user?.name ? m.user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : '??'}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="hidden h-7 items-center gap-1.5 rounded-md border border-zinc-800 bg-panel px-2.5 text-xs text-zinc-200 hover:bg-zinc-900 sm:inline-flex"
          >
            <Plus className="size-3.5" /> Invite
          </button>
          <button
            onClick={handleZip}
            className="hidden h-7 items-center gap-1.5 rounded-md border border-zinc-800 bg-panel px-2.5 text-xs text-zinc-200 hover:bg-zinc-900 sm:inline-flex"
          >
            <Download className="size-3.5" /> ZIP
          </button>
          <button
            onClick={handlePush}
            className="inline-flex h-7 items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 text-xs font-medium text-zinc-900 hover:bg-white"
          >
            <Github className="size-3.5" /> Push
          </button>
        </div>
      </header>

      {/* Modals */}
      {showInviteModal && <InviteModal onClose={() => setShowInviteModal(false)} onInvite={handleInvite} />}
      {showSearchModal && <WorkspaceSearchModal tree={tree} onClose={() => setShowSearchModal(false)} onOpen={openFile} />}

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Left Activity Bar */}
        <aside className="flex w-12 shrink-0 flex-col items-center gap-2 border-r border-zinc-800 bg-surface py-3 z-10">
          <SideIconBtn active={leftSidebarOpen} label="Explorer" onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}>
            <Folder className="size-4" />
          </SideIconBtn>
          <SideIconBtn label="Search" onClick={() => setShowSearchModal(true)}>
            <Search className="size-4" />
          </SideIconBtn>
          <div className="mt-auto flex flex-col items-center gap-2">
            <Link to="/settings" title="Settings" className="grid size-8 place-items-center rounded-md text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200">
              <Settings className="size-4" />
            </Link>
          </div>
        </aside>

        <PanelGroup orientation="horizontal" id="workspace-layout">
          {/* Left sidebar panel — always rendered, collapsible */}
          <Panel
            id="left-sidebar"
            defaultSize={leftSidebarOpen ? "18%" : "0%"}
            minSize="15%"
            maxSize="40%"
            collapsible
            collapsedSize="0%"
            className={`flex flex-col bg-surface border-r border-zinc-800 ${!leftSidebarOpen ? "hidden" : ""}`}
            onResize={(size) => {
              if (size.asPercentage < 1 && leftSidebarOpen) setLeftSidebarOpen(false);
              if (size.asPercentage >= 1 && !leftSidebarOpen) setLeftSidebarOpen(true);
            }}
          >
            <LeftSidebar
              activeFile={active}
              onOpen={openFile}
              workspaceName={workspace.name}
              tree={tree}
              onAddNode={(name, type, parentId) => addToTree(name, type, parentId)}
              onPush={handlePush}
            />
          </Panel>
          <PanelResizeHandle
            className={`w-1 transition-colors cursor-col-resize ${leftSidebarOpen ? "bg-zinc-800 hover:bg-brand/50" : "bg-transparent w-0"}`}
          />

          {/* Editor area panel */}
          <Panel id="editor" className="flex min-w-0 flex-col bg-panel">
            <TabBar tabs={tabs} active={active} onSelect={setActive} onClose={closeTab} onNewTab={addNewTab} />
            <div className="min-h-0 flex-1 overflow-hidden flex flex-col">
              {activeTab ? (
                activeTab.kind === "code" ? (
                  <CodeEditor filename={activeTab.name} workspaceId={workspace.id} />
                ) : (
                  <DocsEditor filename={activeTab.name} />
                )
              ) : (
                <EmptyState />
              )}
            </div>
            <CommitBar onCommit={handleCommit} />
          </Panel>

          {/* Right panel — always rendered, collapsible */}
          <PanelResizeHandle
            className={`w-1 transition-colors cursor-col-resize ${rightSidebarOpen ? "bg-zinc-800 hover:bg-brand/50" : "bg-transparent w-0"}`}
          />
          <Panel
            id="right-sidebar"
            defaultSize={rightSidebarOpen ? "25%" : "0%"}
            minSize="18%"
            maxSize="40%"
            collapsible
            collapsedSize="0%"
            className={`flex flex-col bg-surface border-l border-zinc-800 ${!rightSidebarOpen ? "hidden" : ""}`}
            onResize={(size) => {
              if (size.asPercentage < 1 && rightSidebarOpen) setRightSidebarOpen(false);
              if (size.asPercentage >= 1 && !rightSidebarOpen) setRightSidebarOpen(true);
            }}
          >
            <RightPanel
              active={rightTab}
              comments={comments}
              versionHistory={versionHistory}
              onResolveComment={resolveComment}
              onReplyComment={replyToComment}
              onRestoreVersion={restoreVersion}
              onInvite={() => setShowInviteModal(true)}
              onToast={show}
            />
          </Panel>
        </PanelGroup>

        {/* Right Activity Bar */}
        <aside className="flex w-12 shrink-0 flex-col items-center gap-2 border-l border-zinc-800 bg-surface py-3 z-10">
          {[
            { id: "chat", icon: MessageSquare, label: "Chat" },
            { id: "members", icon: Users, label: "People" },
            { id: "activity", icon: ActivityIcon, label: "Activity" },
            { id: "comments", icon: Circle, label: "Comments" },
            { id: "history", icon: History, label: "History" },
          ].map((t) => (
            <SideIconBtn
              key={t.id}
              active={rightSidebarOpen && rightTab === t.id}
              label={t.label}
              onClick={() => {
                if (rightSidebarOpen && rightTab === t.id) {
                  setRightSidebarOpen(false);
                } else {
                  setRightSidebarOpen(true);
                  setRightTab(t.id as any);
                }
              }}
            >
              <t.icon className="size-4" />
            </SideIconBtn>
          ))}
        </aside>
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

/* ---- Invite Modal ---- */
function InviteModal({ onClose, onInvite }: { onClose: () => void; onInvite: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"Editor" | "Viewer">("Editor");
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-zinc-700 bg-surface p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-100">Invite to workspace</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200"><X className="size-4" /></button>
        </div>
        <input
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          type="email"
          className="mb-3 h-9 w-full rounded-md border border-zinc-700 bg-panel px-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-brand focus:outline-none"
          onKeyDown={(e) => e.key === "Enter" && email && onInvite(email)}
        />
        <div className="mb-4 flex gap-2">
          {(["Editor", "Viewer"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 rounded-md border py-1.5 text-xs font-medium transition-colors ${role === r ? "border-brand bg-brand/10 text-brand" : "border-zinc-700 text-zinc-400 hover:border-zinc-600"}`}
            >
              {r}
            </button>
          ))}
        </div>
        <button
          onClick={() => email && onInvite(email)}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-brand py-2 text-xs font-medium text-brand-foreground hover:brightness-110"
        >
          <Send className="size-3.5" /> Send invite
        </button>
      </div>
    </div>
  );
}

function WorkspaceSearchModal({ tree, onClose, onOpen }: { tree: FileNode[]; onClose: () => void; onOpen: (n: FileNode) => void }) {
  const [query, setQuery] = useState("");
  
  // flatten tree for searching
  const flatten = (nodes: FileNode[]): FileNode[] => {
    let result: FileNode[] = [];
    for (const n of nodes) {
      if (n.type === "file") result.push(n);
      if (n.children) result = result.concat(flatten(n.children));
    }
    return result;
  };
  
  const allFiles = flatten(tree);
  const results = query.trim() ? allFiles.filter(f => f.name.toLowerCase().includes(query.toLowerCase())) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[15vh] backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-zinc-700 bg-surface shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
          <Search className="size-4 text-zinc-500" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files by name…"
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter" && results.length > 0) {
                onOpen(results[0]);
                onClose();
              }
            }}
          />
          <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">ESC</kbd>
        </div>
        
        {query && (
          <div className="max-h-80 overflow-y-auto py-2">
            {results.length === 0 ? (
              <p className="px-4 py-3 text-xs text-zinc-500">No files found matching "{query}"</p>
            ) : (
              <ul className="flex flex-col">
                {results.map((f, i) => (
                  <li key={f.id}>
                    <button
                      onClick={() => { onOpen(f); onClose(); }}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-zinc-800 ${i === 0 ? "bg-zinc-800/50" : ""}`}
                    >
                      {f.language === "Markdown" ? (
                        <FileText className="size-4 text-zinc-500" />
                      ) : (
                        <FileIcon className="size-4 text-zinc-500" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-200">{f.name}</p>
                        <p className="truncate text-[10px] text-zinc-500">{f.id}</p>
                      </div>
                      {i === 0 && <kbd className="hidden rounded bg-brand/20 px-1.5 py-0.5 font-mono text-[10px] text-brand sm:inline-block">Enter</kbd>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ----------------- Sidebar / File tree ----------------- */

function LeftSidebar({
  activeFile,
  onOpen,
  workspaceName,
  tree,
  onAddNode,
  onPush,
}: {
  activeFile: string;
  onOpen: (n: FileNode) => void;
  workspaceName: string;
  tree: FileNode[];
  onAddNode: (name: string, type: "file" | "folder", parentId?: string) => void;
  onPush: () => void;
}) {
  const [newNodePrompt, setNewNodePrompt] = useState<null | "file" | "folder">(null);
  const [newNodeName, setNewNodeName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (newNodePrompt) inputRef.current?.focus();
  }, [newNodePrompt]);

  const submitNewNode = () => {
    if (newNodeName.trim()) {
      onAddNode(newNodeName.trim(), newNodePrompt!);
    }
    setNewNodePrompt(null);
    setNewNodeName("");
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 pt-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Explorer</span>
      </div>

      <div className="mx-3 mt-3 truncate rounded-md border border-zinc-800 bg-panel px-2.5 py-1.5 font-mono text-xs text-zinc-300">
        {workspaceName}
      </div>

      <div className="mt-2 flex items-center gap-1 px-3">
        <button
          onClick={() => { setNewNodePrompt("file"); setNewNodeName(""); }}
          className="flex flex-1 items-center justify-center gap-1 rounded border border-zinc-800 bg-panel px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-900"
        >
          <FilePlus className="size-3" /> File
        </button>
        <button
          onClick={() => { setNewNodePrompt("folder"); setNewNodeName(""); }}
          className="flex flex-1 items-center justify-center gap-1 rounded border border-zinc-800 bg-panel px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-900"
        >
          <FolderPlus className="size-3" /> Folder
        </button>
      </div>

      {/* Inline new node input */}
      {newNodePrompt && (
        <div className="mx-3 mt-2 flex items-center gap-1">
          <input
            ref={inputRef}
            value={newNodeName}
            onChange={(e) => setNewNodeName(e.target.value)}
            placeholder={newNodePrompt === "file" ? "filename.ts" : "folder-name"}
            className="h-7 flex-1 rounded border border-brand bg-panel px-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") submitNewNode();
              if (e.key === "Escape") { setNewNodePrompt(null); setNewNodeName(""); }
            }}
          />
          <button onClick={submitNewNode} className="rounded bg-brand px-2 py-1 text-[10px] font-bold text-brand-foreground hover:brightness-110">OK</button>
          <button onClick={() => { setNewNodePrompt(null); setNewNodeName(""); }} className="text-zinc-500 hover:text-zinc-200"><X className="size-3.5" /></button>
        </div>
      )}

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        <TreeList nodes={tree} depth={0} activeFile={activeFile} onOpen={onOpen} onAddToFolder={onAddNode} />
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
          <button
            onClick={onPush}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded bg-brand py-1.5 text-[11px] font-medium text-brand-foreground hover:brightness-110"
          >
            <Github className="size-3" /> Push to GitHub
          </button>
        </div>
      </div>
    </div>
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
  onAddToFolder,
}: {
  nodes: FileNode[];
  depth: number;
  activeFile: string;
  onOpen: (n: FileNode) => void;
  onAddToFolder: (name: string, type: "file" | "folder", parentId?: string) => void;
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      {nodes.map((n) => (
        <TreeNode key={n.id} node={n} depth={depth} activeFile={activeFile} onOpen={onOpen} onAddToFolder={onAddToFolder} />
      ))}
    </ul>
  );
}

function TreeNode({
  node,
  depth,
  activeFile,
  onOpen,
  onAddToFolder,
}: {
  node: FileNode;
  depth: number;
  activeFile: string;
  onOpen: (n: FileNode) => void;
  onAddToFolder: (name: string, type: "file" | "folder", parentId?: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [adding, setAdding] = useState<null | "file" | "folder">(null);
  const [newName, setNewName] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);
  const isActive = node.id === activeFile;
  const isFolder = node.type === "folder";

  useEffect(() => {
    if (adding) addInputRef.current?.focus();
  }, [adding]);

  const submitAdd = () => {
    if (newName.trim() && adding) {
      onAddToFolder(newName.trim(), adding, node.id);
      setOpen(true);
    }
    setAdding(null);
    setNewName("");
  };

  return (
    <li>
      <div className="group flex items-center">
        <button
          onClick={() => (isFolder ? setOpen((o) => !o) : onOpen(node))}
          className={
            "flex flex-1 min-w-0 items-center gap-1.5 rounded px-1.5 py-1 text-left text-[13px] " +
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
        {/* Folder inline action buttons — show on hover */}
        {isFolder && (
          <div className="flex shrink-0 items-center gap-0.5 pr-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); setAdding("file"); setNewName(""); setOpen(true); }}
              title="New file in folder"
              className="grid size-5 place-items-center rounded text-zinc-600 hover:bg-zinc-800 hover:text-zinc-200"
            >
              <FilePlus className="size-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setAdding("folder"); setNewName(""); setOpen(true); }}
              title="New subfolder"
              className="grid size-5 place-items-center rounded text-zinc-600 hover:bg-zinc-800 hover:text-zinc-200"
            >
              <FolderPlus className="size-3" />
            </button>
          </div>
        )}
      </div>
      {isFolder && open && (
        <>
          {node.children && (
            <TreeList nodes={node.children} depth={depth + 1} activeFile={activeFile} onOpen={onOpen} onAddToFolder={onAddToFolder} />
          )}
          {adding && (
            <li style={{ paddingLeft: 6 + (depth + 1) * 12 }} className="flex items-center gap-1 py-0.5 pr-2">
              <input
                ref={addInputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={adding === "file" ? "filename.ts" : "folder-name"}
                className="h-6 flex-1 rounded border border-brand bg-panel px-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitAdd();
                  if (e.key === "Escape") { setAdding(null); setNewName(""); }
                }}
              />
              <button onClick={submitAdd} className="rounded bg-brand px-1.5 py-0.5 text-[9px] font-bold text-brand-foreground">OK</button>
              <button onClick={() => { setAdding(null); setNewName(""); }} className="text-zinc-500 hover:text-zinc-200"><X className="size-3" /></button>
            </li>
          )}
        </>
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
  onNewTab,
}: {
  tabs: Tab[];
  active: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNewTab: () => void;
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
      <button
        onClick={onNewTab}
        className="grid w-9 place-items-center text-zinc-600 hover:text-zinc-300"
        title="New file"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

/* ----------------- Editors ----------------- */

const ydocs = new Map<string, Y.Doc>();
const yproviders = new Map<string, WebsocketProvider>();

function getWorkspaceDoc(workspaceId: string, filename: string, user: any) {
  const roomName = `${workspaceId}_${filename}`;
  if (!ydocs.has(roomName)) {
    const doc = new Y.Doc();
    const provider = new WebsocketProvider("ws://localhost:1234", roomName, doc);
    
    provider.awareness.setLocalStateField("user", {
      name: user?.name || "Anonymous",
      color: user?.color || "#10b981",
    });
    
    ydocs.set(roomName, doc);
    yproviders.set(roomName, provider);
  }
  return { doc: ydocs.get(roomName)!, provider: yproviders.get(roomName)! };
}

const defaultContent = (filename: string) => {
  if (filename.endsWith(".ts") || filename.endsWith(".tsx")) {
    return `import { Router } from "express";\nimport { auth } from "./middleware";\n\n// Real-time collaborative session initialised\nconst router = Router();\n\nrouter.use(auth);\n\nrouter.get("/health", (req, res) => {\n  return res.status(200).send({ status: "up" });\n});\n\nexport default router;\n`;
  }
  return `// Start coding in ${filename}...\n`;
};

function CodeEditor({ filename, workspaceId }: { filename: string; workspaceId: string }) {
  const { user } = useAuth();
  
  const language = filename.endsWith(".ts") || filename.endsWith(".tsx") ? "typescript"
    : filename.endsWith(".json") ? "json"
    : filename.endsWith(".md") ? "markdown"
    : "javascript";

  const { doc, provider } = useMemo(() => getWorkspaceDoc(workspaceId, filename, user), [workspaceId, filename, user]);
  const ytext = useMemo(() => doc.getText(filename), [doc, filename]);
  
  // Initialize with default content if empty
  useEffect(() => {
    if (ytext.toString().length === 0) {
      ytext.insert(0, defaultContent(filename));
    }
  }, [ytext, filename]);

  const handleEditorMount = (editor: any, monaco: any) => {
    new MonacoBinding(ytext, editor.getModel(), new Set([editor]), provider.awareness);
  };

  return (
    <div className="flex h-full w-full flex-col bg-panel">
      <div className="h-full w-full py-2">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: true },
            fontSize: 13,
            fontFamily: "var(--font-mono)",
            lineHeight: 24,
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            formatOnPaste: true,
          }}
          loading={<div className="grid h-full place-items-center text-zinc-500 text-xs font-mono">Loading editor…</div>}
        />
      </div>
    </div>
  );
}

const FORMATTING_BUTTONS = [
  { label: "H1", icon: Heading1, wrap: (s: string) => `# ${s}` },
  { label: "H2", icon: Heading2, wrap: (s: string) => `## ${s}` },
  { label: "B", icon: Bold, wrap: (s: string) => `**${s}**` },
  { label: "I", icon: Italic, wrap: (s: string) => `_${s}_` },
  { label: "U", icon: Underline, wrap: (s: string) => `<u>${s}</u>` },
  { label: "•", icon: List, wrap: (s: string) => `- ${s}` },
  { label: "1.", icon: ListOrdered, wrap: (s: string) => `1. ${s}` },
  { label: "☐", icon: CheckSquare, wrap: (s: string) => `- [ ] ${s}` },
  { label: "{ }", icon: Code, wrap: (s: string) => `\`${s}\`` },
  { label: "❝", icon: Quote, wrap: (s: string) => `> ${s}` },
  { label: "🔗", icon: Link2, wrap: (s: string) => `[${s}](url)` },
];

function DocsEditor({ filename }: { filename: string }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState(`# Gateway architecture\n\nThe mercury API gateway sits between our public edge and our internal services. It is intentionally boring — a router, a health probe, and a handful of well-tested middleware.\n\n## Responsibilities\n\n- Terminate TLS and normalise incoming HTTP.\n- Enforce authentication via \`auth\` middleware.\n- Route requests to internal services by hostname.\n- Emit structured access logs for every request.\n\n## Health checks\n\nThe \`/health\` endpoint returns \`{ status: "up" }\` when the process is accepting connections.\n\n## Deployment\n\n1. Merge to \`main\`.\n2. CI builds the image and pushes to the registry.\n3. Argo rolls out to \`gateway-prod\`.\n`);

  const applyFormat = (wrap: (s: string) => string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end) || "text";
    const replacement = wrap(selected);
    const newContent = content.slice(0, start) + replacement + content.slice(end);
    setContent(newContent);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start, start + replacement.length);
    }, 0);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-panel">
      {/* Toolbar */}
      <div className="flex h-9 shrink-0 items-center gap-0.5 border-b border-zinc-800 bg-surface/50 px-3 text-xs text-zinc-400 overflow-x-auto">
        {FORMATTING_BUTTONS.map((btn) => (
          <button
            key={btn.label}
            title={btn.label}
            onClick={() => applyFormat(btn.wrap)}
            className="rounded px-1.5 py-1 hover:bg-zinc-800 hover:text-zinc-100 transition-colors shrink-0"
          >
            <btn.icon className="size-3.5" />
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 shrink-0">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> 3 editing
        </div>
      </div>
      {/* Editable textarea */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="h-full w-full resize-none bg-transparent px-10 py-12 font-mono text-[13px] leading-relaxed text-zinc-300 focus:outline-none"
          spellCheck={false}
          placeholder="Start writing…"
        />
      </div>
      <div className="shrink-0 border-t border-zinc-800 px-4 py-1.5 text-[10px] font-mono text-zinc-600">
        {filename} · {content.split("\n").length} lines
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

function CommitBar({ onCommit }: { onCommit: (msg: string, andPush: boolean) => void }) {
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
          onKeyDown={(e) => e.key === "Enter" && onCommit(msg, false)}
        />
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onCommit(msg, false)}
          className="rounded-md border border-zinc-800 bg-panel px-2.5 py-1 text-[11px] text-zinc-200 hover:bg-zinc-900"
        >
          Commit
        </button>
        <button
          onClick={() => onCommit(msg, true)}
          className="inline-flex items-center gap-1 rounded-md bg-brand px-2.5 py-1 text-[11px] font-medium text-brand-foreground hover:brightness-110"
        >
          <Github className="size-3" /> Commit & push
        </button>
      </div>
    </div>
  );
}

/* ----------------- Right panel ----------------- */

type CommentData = typeof initialComments[number] & { replies?: string[] };

function RightPanel({
  active,
  comments,
  versionHistory,
  onResolveComment,
  onReplyComment,
  onRestoreVersion,
  onInvite,
  onToast,
}: {
  active: "members" | "chat" | "activity" | "comments" | "history";
  comments: CommentData[];
  versionHistory: typeof initialVersionHistory;
  onResolveComment: (id: string) => void;
  onReplyComment: (id: string, text: string) => void;
  onRestoreVersion: (label: string) => void;
  onInvite: () => void;
  onToast: (msg: string, type?: "success" | "error" | "info") => void;
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 border-b border-zinc-800 px-4 py-3">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-100">{active}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden flex flex-col">
        {active === "chat" && <ChatPanel onToast={onToast} />}
        {active === "members" && <MembersPanel onInvite={onInvite} />}
        {active === "activity" && <ActivityPanel />}
        {active === "comments" && (
          <CommentsPanel
            comments={comments}
            onResolve={onResolveComment}
            onReply={onReplyComment}
          />
        )}
        {active === "history" && (
          <HistoryPanel versionHistory={versionHistory} onRestore={onRestoreVersion} />
        )}
      </div>
    </div>
  );
}

function ChatPanel({ onToast }: { onToast: (msg: string, type?: "success" | "error" | "info") => void }) {
  const [draft, setDraft] = useState("");
  const [chatMessages, setChatMessages] = useState(initialMessages);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const EMOJIS = ["👍", "❤️", "🔥", "✅", "🚀", "😄", "🎉", "👀", "💡", "⚠️"];

  const sendMessage = () => {
    if (!draft.trim()) return;
    const newMsg = {
      id: `m${Date.now()}`,
      author: members[0],
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      body: draft.trim(),
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setDraft("");
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const handleAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newMsg = {
        id: `m${Date.now()}`,
        author: members[0],
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
        body: `📎 Attached: ${file.name}`,
      };
      setChatMessages((prev) => [...prev, newMsg]);
      onToast(`Attached: ${file.name}`, "success");
    }
    e.target.value = "";
  };

  return (
    <div className="flex h-full flex-col relative">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <div className="text-center font-mono text-[10px] uppercase tracking-widest text-zinc-600">
          — today —
        </div>
        {chatMessages.map((m) => (
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
        <div ref={messagesEndRef} />
      </div>
      <div className="shrink-0 border-t border-zinc-800 p-3">
        <div className="rounded-md border border-zinc-800 bg-panel focus-within:border-zinc-700">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message the workspace… ⌘⏎ to send"
            className="w-full resize-none bg-transparent p-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
            rows={2}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") sendMessage();
            }}
          />
          <div className="flex items-center justify-between border-t border-zinc-800/60 px-2 py-1.5">
            <div className="flex items-center gap-1 text-zinc-500 relative">
              <button
                onClick={handleAttach}
                title="Attach file"
                className="rounded p-1 hover:bg-zinc-800 hover:text-zinc-200"
              >
                <Paperclip className="size-3.5" />
              </button>
              <button
                onClick={() => setShowEmojiPicker((v) => !v)}
                title="Emoji"
                className="rounded p-1 hover:bg-zinc-800 hover:text-zinc-200"
              >
                <Smile className="size-3.5" />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-8 left-0 z-10 flex flex-wrap gap-1 rounded-lg border border-zinc-700 bg-zinc-900 p-2 shadow-xl w-44">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => { setDraft((d) => d + emoji); setShowEmojiPicker(false); }}
                      className="rounded p-1 text-lg hover:bg-zinc-800"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={sendMessage}
              className="inline-flex items-center gap-1 rounded bg-brand px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-foreground hover:brightness-110"
            >
              Send <Send className="size-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MembersPanel({ onInvite }: { onInvite: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-zinc-800 p-3">
        <button
          onClick={onInvite}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-zinc-800 bg-panel py-1.5 text-xs text-zinc-200 hover:bg-zinc-900"
        >
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

function CommentsPanel({
  comments,
  onResolve,
  onReply,
}: {
  comments: CommentData[];
  onResolve: (id: string) => void;
  onReply: (id: string, text: string) => void;
}) {
  const grouped = useMemo(() => ({
    open: comments.filter((c) => !c.resolved),
    resolved: comments.filter((c) => c.resolved),
  }), [comments]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-zinc-800 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
        Open — {grouped.open.length}
      </div>
      {grouped.open.map((c) => (
        <CommentCard key={c.id} c={c} onResolve={onResolve} onReply={onReply} />
      ))}
      <div className="border-y border-zinc-800 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
        Resolved — {grouped.resolved.length}
      </div>
      {grouped.resolved.map((c) => (
        <CommentCard key={c.id} c={c} muted onResolve={onResolve} onReply={onReply} />
      ))}
    </div>
  );
}

function CommentCard({
  c,
  muted,
  onResolve,
  onReply,
}: {
  c: CommentData;
  muted?: boolean;
  onResolve: (id: string) => void;
  onReply: (id: string, text: string) => void;
}) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  const submitReply = () => {
    if (!replyText.trim()) return;
    onReply(c.id, replyText.trim());
    setReplyText("");
    setReplying(false);
  };

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

          {/* Replies */}
          {(c.replies ?? []).map((r, i) => (
            <div key={i} className="mt-2 flex items-start gap-2 border-l-2 border-zinc-700 pl-2">
              <span className={`grid size-5 shrink-0 place-items-center rounded-full ${members[0].color} text-[9px] font-bold text-zinc-950`}>
                {members[0].initials}
              </span>
              <p className="text-[11px] text-zinc-400">{r}</p>
            </div>
          ))}

          {!c.resolved && (
            <div className="mt-2.5 flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              <button
                onClick={() => setReplying((v) => !v)}
                className="inline-flex items-center gap-1 hover:text-zinc-200"
              >
                <Reply className="size-3" /> Reply
              </button>
              <button
                onClick={() => onResolve(c.id)}
                className="inline-flex items-center gap-1 hover:text-brand"
              >
                <Check className="size-3" /> Resolve
              </button>
            </div>
          )}

          {replying && (
            <div className="mt-2 flex gap-1">
              <input
                autoFocus
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply…"
                className="h-7 flex-1 rounded border border-zinc-700 bg-panel px-2 text-[11px] text-zinc-100 placeholder:text-zinc-600 focus:border-brand focus:outline-none"
                onKeyDown={(e) => { if (e.key === "Enter") submitReply(); if (e.key === "Escape") setReplying(false); }}
              />
              <button onClick={submitReply} className="rounded bg-brand px-2 py-1 text-[10px] font-bold text-brand-foreground hover:brightness-110">Send</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryPanel({
  versionHistory,
  onRestore,
}: {
  versionHistory: typeof initialVersionHistory;
  onRestore: (label: string) => void;
}) {
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
            <button
              onClick={() => onRestore(v.label)}
              className="mt-2 inline-flex items-center gap-1 rounded border border-zinc-800 bg-panel px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 opacity-0 hover:bg-zinc-900 hover:text-zinc-100 group-hover:opacity-100"
            >
              <RotateCcw className="size-2.5" /> Restore
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
