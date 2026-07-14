export type Member = {
  id: string;
  name: string;
  handle: string;
  initials: string;
  color: string; // tailwind bg class
  role: "Owner" | "Editor" | "Viewer";
  online: boolean;
};

export type Workspace = {
  id: string;
  name: string;
  description: string;
  visibility: "Private" | "Public";
  language: string;
  updated: string;
  members: Member[];
  starred?: boolean;
};

export const members: Member[] = [
  { id: "u1", name: "Alex Morgan", handle: "alex", initials: "AM", color: "bg-emerald-500", role: "Owner", online: true },
  { id: "u2", name: "Jordan Lee", handle: "jordan", initials: "JL", color: "bg-sky-500", role: "Editor", online: true },
  { id: "u3", name: "Priya Shah", handle: "priya", initials: "PS", color: "bg-fuchsia-500", role: "Editor", online: true },
  { id: "u4", name: "Marcus Chen", handle: "marcus", initials: "MC", color: "bg-amber-500", role: "Editor", online: false },
  { id: "u5", name: "Raju Kumar", handle: "raju", initials: "RK", color: "bg-rose-500", role: "Viewer", online: false },
];

export const workspaces: Workspace[] = [
  {
    id: "mercury-api-gateway",
    name: "mercury-api-gateway",
    description: "Core infrastructure for the distributed request broker.",
    visibility: "Private",
    language: "TypeScript",
    updated: "2 min ago",
    members: members.slice(0, 4),
    starred: true,
  },
  {
    id: "flux-ui-kit",
    name: "flux-ui-kit",
    description: "Shared component library built with Tailwind and Radix.",
    visibility: "Public",
    language: "TypeScript",
    updated: "1 hour ago",
    members: members.slice(1, 4),
  },
  {
    id: "atlas-docs",
    name: "atlas-docs",
    description: "Public documentation portal — authored collaboratively in Markdown.",
    visibility: "Public",
    language: "MDX",
    updated: "yesterday",
    members: members.slice(0, 3),
  },
  {
    id: "orbit-schema-lab",
    name: "orbit-schema-lab",
    description: "Database schema drafts and migration playbooks.",
    visibility: "Private",
    language: "SQL",
    updated: "3 days ago",
    members: members.slice(2, 5),
  },
  {
    id: "helios-marketing",
    name: "helios-marketing",
    description: "Landing page copy, briefs and design tokens.",
    visibility: "Private",
    language: "MDX",
    updated: "last week",
    members: [members[0], members[2]],
    starred: true,
  },
  {
    id: "signal-mobile-app",
    name: "signal-mobile-app",
    description: "React Native client — shared with contractors.",
    visibility: "Private",
    language: "TypeScript",
    updated: "last week",
    members: members.slice(0, 5),
  },
];

export type FileNode = {
  id: string;
  name: string;
  type: "file" | "folder";
  language?: string;
  children?: FileNode[];
};

export const fileTree: FileNode[] = [
  {
    id: "src",
    name: "src",
    type: "folder",
    children: [
      { id: "src/index.ts", name: "index.ts", type: "file", language: "TypeScript" },
      { id: "src/middleware.ts", name: "middleware.ts", type: "file", language: "TypeScript" },
      { id: "src/routes.ts", name: "routes.ts", type: "file", language: "TypeScript" },
      {
        id: "src/handlers",
        name: "handlers",
        type: "folder",
        children: [
          { id: "src/handlers/auth.ts", name: "auth.ts", type: "file", language: "TypeScript" },
          { id: "src/handlers/users.ts", name: "users.ts", type: "file", language: "TypeScript" },
        ],
      },
    ],
  },
  {
    id: "docs",
    name: "docs",
    type: "folder",
    children: [
      { id: "docs/Architecture.md", name: "Architecture.md", type: "file", language: "Markdown" },
      { id: "docs/RFC-0012.md", name: "RFC-0012.md", type: "file", language: "Markdown" },
    ],
  },
  { id: "package.json", name: "package.json", type: "file", language: "JSON" },
  { id: "README.md", name: "README.md", type: "file", language: "Markdown" },
];

export const activity = [
  { id: "a1", who: "Alex Morgan", action: "pushed 3 commits to", target: "main", when: "just now" },
  { id: "a2", who: "Jordan Lee", action: "commented on", target: "index.ts:24", when: "2m ago" },
  { id: "a3", who: "Priya Shah", action: "created", target: "docs/RFC-0012.md", when: "18m ago" },
  { id: "a4", who: "Marcus Chen", action: "restored version", target: "v4 · middleware.ts", when: "1h ago" },
  { id: "a5", who: "Alex Morgan", action: "invited", target: "Raju Kumar", when: "yesterday" },
  { id: "a6", who: "System", action: "saved snapshot", target: "auto · v0.14.2", when: "yesterday" },
];

export const messages = [
  { id: "m1", author: members[0], time: "14:02", body: "I've added the health check route. Ready for review?" },
  { id: "m2", author: members[1], time: "14:05", body: "Looks solid. Let's merge it after the lint check passes." },
  { id: "m3", author: members[2], time: "14:11", body: "Left a note on `middleware.ts:31` — the header check can be simplified." },
  { id: "m4", author: members[0], time: "14:12", body: "Good catch, updating now." },
];

export const versionHistory = [
  { id: "v6", label: "v0.14.2", author: "Alex Morgan", when: "just now", note: "wire health check into router" },
  { id: "v5", label: "v0.14.1", author: "Jordan Lee", when: "2h ago", note: "extract middleware factory" },
  { id: "v4", label: "v0.14.0", author: "Priya Shah", when: "yesterday", note: "docs: architecture overview" },
  { id: "v3", label: "v0.13.4", author: "Alex Morgan", when: "2 days ago", note: "release: prep for staging" },
  { id: "v2", label: "v0.13.3", author: "Marcus Chen", when: "last week", note: "fix: query param serialization" },
];

export const comments = [
  {
    id: "c1",
    file: "index.ts",
    line: 3,
    author: members[1],
    body: "Should we type this as a `RouterOptions` instead of the raw factory return?",
    when: "5m ago",
    resolved: false,
  },
  {
    id: "c2",
    file: "middleware.ts",
    line: 31,
    author: members[2],
    body: "This header check duplicates the one in `auth.ts` — DRY it up?",
    when: "12m ago",
    resolved: false,
  },
  {
    id: "c3",
    file: "docs/Architecture.md",
    line: 88,
    author: members[0],
    body: "I've expanded the diagram in the next commit.",
    when: "1h ago",
    resolved: true,
  },
];

export const notifications = [
  { id: "n1", title: "Jordan mentioned you", body: "in mercury-api-gateway · index.ts", when: "2m", unread: true },
  { id: "n2", title: "Push succeeded", body: "main → origin/main (3 commits)", when: "5m", unread: true },
  { id: "n3", title: "Priya invited you", body: "to workspace atlas-docs", when: "1h", unread: false },
  { id: "n4", title: "Snapshot saved", body: "flux-ui-kit · v0.4.1", when: "yesterday", unread: false },
];
