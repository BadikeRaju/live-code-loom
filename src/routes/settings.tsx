import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Github, Trash2, Save, Upload, Eye, EyeOff, CheckCircle2, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { API_URL } from "@/lib/config";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — CoFlux" },
      { name: "description", content: "Manage your CoFlux profile, GitHub connection and appearance." },
    ],
  }),
  component: SettingsPage,
});

type Toast = { id: string; message: string; type: "success" | "error" | "info" };

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = (message: string, type: Toast["type"] = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };
  return { toasts, show };
}

function SettingsPage() {
  const { toasts, show } = useToast();

  const { user, token, setAvatar } = useAuth();

  // Profile state
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [timezone, setTimezone] = useState("Europe/London");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [githubToken, setGithubToken] = useState(user?.githubToken || "");

  useEffect(() => {
    if (user) {
      setDisplayName(user.name);
      setEmail(user.email);
      setAvatarUrl(user.avatar || null);
      setGithubToken(user.githubToken || "");
    }
  }, [user]);

  // Password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // 2FA state
  const [twoFA, setTwoFA] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);

  // GitHub state
  const [githubConnected, setGithubConnected] = useState(true);

  // Appearance state
  const [theme, setTheme] = useState("Obsidian");

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const saveProfile = async () => {
    if (!displayName.trim()) { show("Display name is required", "error"); return; }
    try {
      const res = await fetch(`${API_URL}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: displayName, avatar: avatarUrl, githubToken })
      });
      if (res.ok) {
        show("Profile saved successfully", "success");
      } else {
        show("Failed to save profile", "error");
      }
    } catch (err) {
      show("Error saving profile", "error");
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { show("File too large — max 5 MB", "error"); return; }

    show("Uploading avatar...", "info");
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch(`${API_URL}/api/profile`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: displayName, avatar: base64, githubToken })
        });
        if (res.ok) {
          setAvatarUrl(base64);
          setAvatar(base64);
          show("Avatar updated", "success");
        } else {
          show("Failed to update avatar", "error");
        }
      } catch {
        show("Upload failed", "error");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch(`${API_URL}/api/account`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        localStorage.clear();
        window.location.href = '/login';
      } else {
        show("Failed to delete account", "error");
      }
    } catch (err) {
      show("Error deleting account", "error");
    }
  };

  const disconnectGithub = () => {
    setGithubConnected(false);
    show("GitHub disconnected", "info");
  };

  const connectGithub = () => {
    setTimeout(() => { setGithubConnected(true); show("GitHub connected as @alex-morgan", "success"); }, 800);
    show("Connecting to GitHub…", "info");
  };

  const changeTheme = (t: string) => {
    setTheme(t);
    show(`Theme changed to ${t}`, "success");
  };

  return (
    <AppShell>
      {/* Toasts */}
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

      {/* Modals */}
      {showPasswordModal && <PasswordModal onClose={() => setShowPasswordModal(false)} onSave={() => { setShowPasswordModal(false); show("Password changed", "success"); }} />}
      {show2FAModal && <TwoFAModal onClose={() => setShow2FAModal(false)} onEnable={() => { setShow2FAModal(false); setTwoFA(true); show("Two-factor auth enabled", "success"); }} />}
      {showDeleteModal && <DeleteModal onClose={() => setShowDeleteModal(false)} onDelete={() => { setShowDeleteModal(false); handleDeleteAccount(); }} />}

      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">Profile, connections and appearance.</p>

        <div className="mt-8 flex flex-col gap-6">
          {/* Profile */}
          <Section title="Profile" subtitle="How you appear across the workspace.">
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleAvatarUpload} />
            <div className="flex items-center gap-5">
              <div className="relative group">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="size-16 rounded-full object-cover" />
                ) : (
                  <div className="grid size-16 place-items-center rounded-full bg-emerald-500 text-lg font-bold text-zinc-950">
                    {displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Upload className="size-5 text-white" />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-800 bg-panel px-3 text-xs text-zinc-200 hover:bg-zinc-900"
                >
                  <Upload className="size-3.5" /> Upload avatar
                </button>
                <span className="text-[11px] text-zinc-500">PNG or JPG · max 5 MB</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Display name" value={displayName} onChange={setDisplayName} />
              <Field label="Handle" value={handle} onChange={setHandle} prefix="@" />
              <Field label="Email" value={email} onChange={setEmail} type="email" />
              <div className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
                Timezone
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="h-9 rounded-md border border-zinc-800 bg-surface px-3 text-sm text-zinc-100 focus:border-brand focus:outline-none"
                >
                  {["Europe/London", "America/New_York", "America/Los_Angeles", "Asia/Kolkata", "Asia/Tokyo", "UTC"].map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
              Bio
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="rounded-md border border-zinc-800 bg-surface p-2.5 text-sm text-zinc-100 focus:border-brand focus:outline-none resize-none"
              />
            </label>
            <div className="flex justify-end">
              <button
                onClick={saveProfile}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-xs font-medium text-brand-foreground hover:brightness-110"
              >
                <Save className="size-3.5" /> Save profile
              </button>
            </div>
          </Section>

          {/* GitHub */}
          <Section title="GitHub" subtitle="Push workspaces directly to your repositories.">
            <div className="flex flex-col gap-3">
              <Field
                label="Personal Access Token (PAT)"
                value={githubToken}
                onChange={setGithubToken}
                type="password"
              />
              <p className="text-xs text-zinc-500">Requires `repo` scope to commit and push to your repositories.</p>
              <div className="flex justify-end">
                <button
                  onClick={saveProfile}
                  className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-xs font-medium text-brand-foreground hover:brightness-110"
                >
                  <Save className="size-3.5" /> Save GitHub Token
                </button>
              </div>
            </div>
          </Section>

          {/* Security */}
          <Section title="Security" subtitle="Password and two-factor authentication.">
            <div className="flex items-center justify-between rounded-md border border-zinc-800 bg-surface p-4">
              <div>
                <p className="text-sm font-medium text-zinc-100">Password</p>
                <p className="text-xs text-zinc-500">Last changed 42 days ago</p>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="rounded-md border border-zinc-800 bg-panel px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-900"
              >
                Change
              </button>
            </div>
            <div className="flex items-center justify-between rounded-md border border-zinc-800 bg-surface p-4">
              <div>
                <p className="text-sm font-medium text-zinc-100">Two-factor auth</p>
                <p className="text-xs text-zinc-500">
                  {twoFA ? "✓ Enabled — your account is protected" : "Off · enable to protect commits and pushes"}
                </p>
              </div>
              {twoFA ? (
                <button
                  onClick={() => { setTwoFA(false); show("Two-factor auth disabled", "info"); }}
                  className="rounded-md border border-zinc-800 bg-panel px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-900"
                >
                  Disable
                </button>
              ) : (
                <button
                  onClick={() => setShow2FAModal(true)}
                  className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground hover:brightness-110"
                >
                  Enable
                </button>
              )}
            </div>
          </Section>

          {/* Danger zone */}
          <Section title="Danger zone" subtitle="Irreversible destructive actions." danger>
            <div className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 p-4">
              <div>
                <p className="text-sm font-medium text-zinc-100">Delete account</p>
                <p className="text-xs text-zinc-500">
                  Removes all workspaces you own. Collaborators lose access immediately.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/20"
              >
                <Trash2 className="size-3.5" /> Delete
              </button>
            </div>
          </Section>
        </div>
      </div>
    </AppShell>
  );
}

/* ---- Modals ---- */

function PasswordModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [error, setError] = useState("");

  const save = () => {
    if (!current) { setError("Current password is required"); return; }
    if (next.length < 8) { setError("New password must be at least 8 characters"); return; }
    if (next !== confirm) { setError("Passwords don't match"); return; }
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-zinc-700 bg-surface p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-100">Change password</h2>
          <button onClick={onClose}><X className="size-4 text-zinc-500 hover:text-zinc-200" /></button>
        </div>
        <div className="space-y-3">
          <PasswordField label="Current password" value={current} onChange={setCurrent} show={showCurrent} onToggle={() => setShowCurrent(v => !v)} />
          <PasswordField label="New password" value={next} onChange={setNext} show={showNext} onToggle={() => setShowNext(v => !v)} />
          <PasswordField label="Confirm new password" value={confirm} onChange={setConfirm} show={showNext} onToggle={() => setShowNext(v => !v)} />
          {error && <p className="text-xs text-rose-400">{error}</p>}
          {next && (
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${next.length >= i * 3 ? (next.length >= 12 ? "bg-emerald-500" : next.length >= 8 ? "bg-amber-500" : "bg-rose-500") : "bg-zinc-700"}`} />
              ))}
            </div>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-md border border-zinc-700 py-2 text-xs text-zinc-300 hover:bg-zinc-800">Cancel</button>
          <button onClick={save} className="flex-1 rounded-md bg-brand py-2 text-xs font-medium text-brand-foreground hover:brightness-110">Save</button>
        </div>
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, show, onToggle }: { label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
      {label}
      <div className="flex h-9 items-center rounded-md border border-zinc-700 bg-panel focus-within:border-brand">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent px-3 text-sm text-zinc-100 focus:outline-none"
        />
        <button onClick={onToggle} type="button" className="px-2 text-zinc-500 hover:text-zinc-200">
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </label>
  );
}

function TwoFAModal({ onClose, onEnable }: { onClose: () => void; onEnable: () => void }) {
  const [code, setCode] = useState("");
  const FAKE_CODE = "123456";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-zinc-700 bg-surface p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-100">Enable two-factor auth</h2>
          <button onClick={onClose}><X className="size-4 text-zinc-500 hover:text-zinc-200" /></button>
        </div>
        <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-center">
          <div className="grid grid-cols-5 gap-1 mx-auto w-fit mb-2">
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} className={`size-2.5 rounded-sm ${Math.random() > 0.5 ? "bg-zinc-100" : "bg-zinc-900"}`} />
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-3">Scan QR code with your authenticator app</p>
          <p className="text-[10px] text-zinc-600 mt-1">or enter code: <span className="font-mono text-zinc-400">JBSWY3DPEHPK3PXP</span></p>
        </div>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400 mb-4">
          6-digit code (use {FAKE_CODE} to demo)
          <input
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="h-9 rounded-md border border-zinc-700 bg-panel px-3 text-center font-mono text-lg tracking-[0.5em] text-zinc-100 placeholder:text-zinc-600 focus:border-brand focus:outline-none"
          />
        </label>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-md border border-zinc-700 py-2 text-xs text-zinc-300 hover:bg-zinc-800">Cancel</button>
          <button
            onClick={() => code === FAKE_CODE && onEnable()}
            disabled={code.length !== 6}
            className="flex-1 rounded-md bg-brand py-2 text-xs font-medium text-brand-foreground hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Verify & enable
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ onClose, onDelete }: { onClose: () => void; onDelete: () => void }) {
  const [confirm, setConfirm] = useState("");
  const CONFIRM_TEXT = "delete my account";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-rose-800/50 bg-surface p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-rose-400">Delete account</h2>
          <button onClick={onClose}><X className="size-4 text-zinc-500 hover:text-zinc-200" /></button>
        </div>
        <p className="text-xs text-zinc-400 mb-4">
          This will permanently delete your account and all workspaces you own. This action <strong className="text-zinc-100">cannot be undone</strong>.
        </p>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400 mb-4">
          Type <span className="font-mono text-zinc-200">"{CONFIRM_TEXT}"</span> to confirm
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-9 rounded-md border border-rose-800/50 bg-panel px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-rose-600 focus:outline-none"
          />
        </label>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-md border border-zinc-700 py-2 text-xs text-zinc-300 hover:bg-zinc-800">Cancel</button>
          <button
            onClick={onDelete}
            disabled={confirm !== CONFIRM_TEXT}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-rose-700 py-2 text-xs font-medium text-white hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="size-3.5" /> Delete permanently
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
  danger,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <section
      className={
        "rounded-xl border p-6 " +
        (danger ? "border-destructive/30 bg-destructive/[0.02]" : "border-zinc-800 bg-panel")
      }
    >
      <div className="mb-5">
        <h2 className={"text-base font-medium " + (danger ? "text-destructive" : "text-zinc-100")}>
          {title}
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  prefix?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
      {label}
      <div className="flex h-9 items-center rounded-md border border-zinc-800 bg-surface focus-within:border-brand">
        {prefix && <span className="pl-3 text-sm text-zinc-500">{prefix}</span>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent px-3 text-sm text-zinc-100 focus:outline-none"
        />
      </div>
    </label>
  );
}
