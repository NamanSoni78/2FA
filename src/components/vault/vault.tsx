"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CloudCheck,
  Loader2,
  Plus,
  Search,
  Smartphone,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/components/auth-context";
import { CredentialCard } from "@/components/vault/credential-card";
import { AddCredentialDialog } from "@/components/vault/add-credential-dialog";
import { EditCredentialDialog } from "@/components/vault/edit-credential-dialog";
import { SecretDialog } from "@/components/vault/secret-dialog";
import { SyncBanner } from "@/components/vault/sync-banner";
import { EmptyState } from "@/components/vault/empty-state";
import { DataMenu } from "@/components/vault/data-menu";
import { PasswordPromptDialog } from "@/components/vault/password-prompt";
import {
  storedToDisplay,
  viewToDisplay,
  type DisplayCredential,
} from "@/components/vault/vault-types";
import { api, apiError, downloadJson } from "@/lib/client-api";
import {
  clearLocalCredentials,
  getDismissedSyncBanner,
  loadLocalCredentials,
  saveLocalCredentials,
  setDismissedSyncBanner,
} from "@/lib/local-store";
import { generateCode } from "@/lib/totp";
import { validateCredentialInput } from "@/lib/validate";
import type {
  CredentialInput,
  CredentialView,
  StoredCredential,
} from "@/lib/types";

/** Rotating-code cache keyed by `${id}:${counter}` — avoids recomputing HMACs. */
const codeCache = new Map<string, { code: string; expiresAt: number }>();

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function Vault() {
  const { user, loading: authLoading, openAuthDialog } = useAuth();

  /* ------------------------------ state ------------------------------ */
  const [localItems, setLocalItems] = useState<StoredCredential[]>([]);
  const [localCodes, setLocalCodes] = useState<
    Record<string, { code: string; expiresAt: number }>
  >({});
  const [serverItems, setServerItems] = useState<CredentialView[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverLoaded, setServerLoaded] = useState(false);
  const [serverRefreshKey, setServerRefreshKey] = useState(0);

  const [now, setNow] = useState(() => Date.now());
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<DisplayCredential | null>(null);
  const [editingSecret, setEditingSecret] = useState<string | null>(null);
  const [secretItem, setSecretItem] = useState<DisplayCredential | null>(null);
  const [secretLocalValue, setSecretLocalValue] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<DisplayCredential | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [dismissedSync, setDismissedSync] = useState(false);
  const [exportPromptOpen, setExportPromptOpen] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const skipPersistRef = useRef(true);
  const lastFetchRef = useRef(0);

  /* ---------------------------- lifecycle ---------------------------- */

  useEffect(() => {
    setLocalItems(loadLocalCredentials());
    setDismissedSync(getDismissedSyncBanner());
  }, []);

  useEffect(() => {
    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return;
    }
    saveLocalCredentials(localItems);
  }, [localItems]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  /* -------- local-mode codes (browser-side generation, cached) ------- */

  useEffect(() => {
    if (user || localItems.length === 0) return;
    let cancelled = false;

    const compute = async () => {
      const entries = await Promise.all(
        localItems.map(async (item) => {
          const counter =
            item.type === "hotp"
              ? item.counter
              : Math.floor(Date.now() / 1000 / item.period);
          const key = `${item.id}:${counter}`;
          const cached = codeCache.get(key);
          if (cached) return [item.id, cached] as const;
          try {
            const g = await generateCode({
              secret: item.secret,
              type: item.type,
              algorithm: item.algorithm,
              digits: item.digits,
              period: item.period,
              counter: item.counter,
              encoding: item.encoding,
            });
            if (codeCache.size > 400) codeCache.clear();
            codeCache.set(key, g);
            return [item.id, g] as const;
          } catch {
            return [item.id, null] as const;
          }
        }),
      );
      if (cancelled) return;
      setLocalCodes((prev) => {
        let changed = false;
        const next: Record<string, { code: string; expiresAt: number }> = {};
        for (const [id, g] of entries) {
          if (!g) continue;
          next[id] = g;
          if (!prev[id] || prev[id].code !== g.code) changed = true;
        }
        return changed ? next : prev;
      });
    };

    void compute();
    const t = setInterval(() => void compute(), 1000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [localItems, user]);

  /* -------- server-mode codes (fetched, secrets stay server-side) ---- */

  useEffect(() => {
    if (!user) {
      setServerItems([]);
      setServerError(null);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const load = async () => {
      lastFetchRef.current = Date.now();
      const res = await api<{ credentials: CredentialView[] }>("/api/credentials");
      if (cancelled) return;
      setServerLoaded(true);
      if (!res.ok) {
        setServerError(apiError(res.data, "Could not load your credentials."));
        return;
      }
      const creds = (res.data as { credentials: CredentialView[] }).credentials ?? [];
      setServerItems(creds);
      setServerError(null);
      // Refresh just after the soonest TOTP expiry — no idle polling.
      const next = creds.reduce<number>(
        (min, c) => (c.expiresAt ? Math.min(min, c.expiresAt) : min),
        Infinity,
      );
      const delay = Number.isFinite(next)
        ? Math.max(1500, next - Date.now() + 600)
        : 30_000;
      timer = setTimeout(() => void load(), delay);
    };

    void load();

    const onVisible = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastFetchRef.current > 5000
      ) {
        if (timer) clearTimeout(timer);
        void load();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user, serverRefreshKey]);

  useEffect(() => {
    setServerLoaded(false);
  }, [user]);

  /* ---------------------------- derived ------------------------------ */

  const displayItems = useMemo<DisplayCredential[]>(() => {
    const base = user
      ? serverItems.map(viewToDisplay)
      : localItems.map((c) => ({
          ...storedToDisplay(c),
          code: localCodes[c.id]?.code ?? null,
          expiresAt: localCodes[c.id]?.expiresAt ?? null,
        }));
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        (c.issuer ?? "").toLowerCase().includes(q),
    );
  }, [user, serverItems, localItems, localCodes, search]);

  const loading =
    authLoading || (user ? !serverLoaded && !serverError : false);

  const showSearch =
    (user ? serverItems.length >= 5 : localItems.length >= 5) ||
    search.length > 0;

  /* --------------------------- mutations ----------------------------- */

  function makeStored(input: CredentialInput): StoredCredential {
    const iso = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      createdAt: iso,
      updatedAt: iso,
      ...input,
    };
  }

  const handleAdd = useCallback(
    async (input: CredentialInput): Promise<boolean> => {
      if (user) {
        const res = await api("/api/credentials", {
          method: "POST",
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          toast.error(apiError(res.data, "Could not save to your account."));
          return false;
        }
        setServerRefreshKey((k) => k + 1);
        toast.success(`“${input.label}” added`, {
          description: "Saved to your account — synced everywhere you sign in.",
        });
        return true;
      }
      setLocalItems((items) => [...items, makeStored(input)]);
      toast.success(`“${input.label}” added`, {
        description: "Saved in this browser only.",
      });
      return true;
    },
    [user],
  );

  const handleEdit = useCallback(
    async (
      id: string,
      patch: Partial<CredentialInput>,
      source: "local" | "server",
    ): Promise<boolean> => {
      if (source === "server") {
        const res = await api(`/api/credentials/${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
        if (!res.ok) {
          toast.error(apiError(res.data, "Could not save changes."));
          return false;
        }
        setServerRefreshKey((k) => k + 1);
        toast.success("Changes saved");
        return true;
      }
      setLocalItems((items) =>
        items.map((c) =>
          c.id === id
            ? {
                ...c,
                ...patch,
                secret: patch.secret ?? c.secret,
                updatedAt: new Date().toISOString(),
              }
            : c,
        ),
      );
      toast.success("Changes saved");
      return true;
    },
    [],
  );

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      if (deleting.source === "server") {
        const res = await api(
          `/api/credentials/${encodeURIComponent(deleting.id)}`,
          { method: "DELETE" },
        );
        if (!res.ok) {
          toast.error(apiError(res.data, "Could not delete."));
          return;
        }
        setServerItems((items) => items.filter((c) => c.id !== deleting.id));
        setServerRefreshKey((k) => k + 1);
      } else {
        setLocalItems((items) => items.filter((c) => c.id !== deleting.id));
      }
      toast.success(`“${deleting.label}” deleted`);
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  }

  async function copyCode(code: string, label: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`${label} — code copied`, { description: code });
    } catch {
      toast.error("Clipboard unavailable in this context.");
    }
  }

  const handleCopy = useCallback(
    (item: DisplayCredential) => {
      if (item.code) void copyCode(item.code, item.label);
    },
    [],
  );

  const handleHotpNext = useCallback(
    async (item: DisplayCredential) => {
      if (item.source === "server") {
        const res = await api<{ code: string; counter: number }>(
          `/api/credentials/${encodeURIComponent(item.id)}/next`,
          { method: "POST" },
        );
        if (!res.ok) {
          toast.error(apiError(res.data, "Could not advance the counter."));
          return;
        }
        const { code, counter } = res.data as { code: string; counter: number };
        setServerItems((items) =>
          items.map((c) => (c.id === item.id ? { ...c, counter, code } : c)),
        );
        void copyCode(code, item.label);
      } else {
        const nextCounter = item.counter + 1;
        setLocalItems((items) =>
          items.map((c) =>
            c.id === item.id
              ? { ...c, counter: nextCounter, updatedAt: new Date().toISOString() }
              : c,
          ),
        );
        const local = localItems.find((c) => c.id === item.id);
        if (local) {
          try {
            const g = await generateCode({ ...local, counter: nextCounter });
            void copyCode(g.code, item.label);
          } catch {
            /* code will appear via the tick */
          }
        }
      }
    },
    [localItems],
  );

  async function handleUploadLocal() {
    if (!user || !localItems.length) return;
    setSyncBusy(true);
    const payload = localItems.map(({ id, createdAt, updatedAt, ...input }) => input);
    const res = await api<{ imported: number }>("/api/credentials/import", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setSyncBusy(false);
    if (!res.ok) {
      toast.error(apiError(res.data, "Upload failed — your local copies are untouched."));
      return;
    }
    setLocalItems([]);
    clearLocalCredentials();
    setServerRefreshKey((k) => k + 1);
    toast.success(
      `${(res.data as { imported: number }).imported} credential(s) uploaded`,
      { description: "They now sync with your account." },
    );
  }

  /* ------------------------ export / import -------------------------- */

  function exportPayload(credentials: CredentialInput[]) {
    return {
      app: "2fa-authenticator",
      version: 1,
      exportedAt: new Date().toISOString(),
      credentials,
    };
  }

  function handleExportRequest() {
    if (user) {
      setExportPromptOpen(true);
      return;
    }
    if (!localItems.length) {
      toast.error("Nothing to export yet — add an authenticator first.");
      return;
    }
    downloadJson(
      `2fa-backup-${dateStamp()}.json`,
      exportPayload(localItems.map(({ id, createdAt, updatedAt, ...rest }) => rest)),
    );
    toast.success("Backup downloaded", {
      description: "The file contains your secrets in plain text — store it safely.",
    });
  }

  async function exportServer(password: string): Promise<string | null> {
    const res = await api("/api/credentials/export", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    if (!res.ok) return apiError(res.data, "Export failed.");
    const data = res.data as {
      credentials: CredentialInput[];
    };
    downloadJson(`2fa-backup-${dateStamp()}.json`, {
      app: "2fa-authenticator",
      version: 1,
      exportedAt: new Date().toISOString(),
      credentials: data.credentials,
    });
    toast.success("Backup downloaded", {
      description: "The file contains your secrets in plain text — store it safely.",
    });
    return null;
  }

  async function handleImportFile(file: File) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      toast.error("Could not read that file — is it a valid JSON backup?");
      return;
    }
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as { credentials?: unknown[] })?.credentials)
        ? (parsed as { credentials: unknown[] }).credentials
        : null;
    if (!list) {
      toast.error("That file doesn't look like a 2FA Authenticator backup.");
      return;
    }
    const inputs: CredentialInput[] = [];
    for (const raw of list.slice(0, 100)) {
      const check = validateCredentialInput(raw);
      if (check.ok) inputs.push(check.value!);
    }
    if (!inputs.length) {
      toast.error("No valid credentials were found in that file.");
      return;
    }
    if (user) {
      const res = await api<{ imported: number }>("/api/credentials/import", {
        method: "POST",
        body: JSON.stringify(inputs),
      });
      if (!res.ok) {
        toast.error(apiError(res.data, "Import failed."));
        return;
      }
      setServerRefreshKey((k) => k + 1);
      toast.success(`${inputs.length} credential(s) imported to your account`);
    } else {
      setLocalItems((items) => [...items, ...inputs.map(makeStored)]);
      toast.success(`${inputs.length} credential(s) imported to this browser`);
    }
  }

  /* ------------------------- card callbacks -------------------------- */

  const onEdit = useCallback(
    (item: DisplayCredential) => {
      setEditingSecret(
        item.source === "local"
          ? localItems.find((c) => c.id === item.id)?.secret ?? null
          : null,
      );
      setEditing(item);
    },
    [localItems],
  );

  const onShowSecret = useCallback(
    (item: DisplayCredential) => {
      setSecretLocalValue(
        item.source === "local"
          ? localItems.find((c) => c.id === item.id)?.secret ?? null
          : null,
      );
      setSecretItem(item);
    },
    [localItems],
  );

  /* ---------------------- keyboard shortcuts ------------------------- */

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (typing) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setAddOpen(true);
      } else if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ------------------------------ view ------------------------------- */

  const showSyncBanner =
    user && localItems.length > 0 && !dismissedSync && !syncBusy;

  return (
    <section id="vault" aria-label="Your authenticators" className="scroll-mt-20">
      <div className="flex flex-wrap items-center gap-2.5">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
          Your authenticators
        </h2>
        <Badge
          variant="secondary"
          className="gap-1.5 rounded-full px-3 py-1 font-medium"
        >
          {user ? (
            <>
              <CloudCheck className="size-3.5 text-primary" />
              Synced to account
            </>
          ) : (
            <>
              <Smartphone className="size-3.5" />
              This browser only
            </>
          )}
        </Badge>
        {!user && !authLoading && (
          <button
            type="button"
            onClick={() => openAuthDialog("signup")}
            className="text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            Create an account to sync →
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
        {showSearch && (
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              type="search"
              placeholder="Search… (press /)"
              className="h-10 rounded-full pl-9 pr-4"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search credentials"
            />
          </div>
        )}
        <div className={`flex items-center gap-2 ${showSearch ? "" : "ml-auto"}`}>
          <DataMenu
            onExport={handleExportRequest}
            onImportFile={(f) => void handleImportFile(f)}
          />
          <Button
            onClick={() => setAddOpen(true)}
            className="h-10 gap-2 rounded-full px-4 font-semibold shadow-sm transition-transform hover:-translate-y-px active:scale-[0.98] sm:px-5"
          >
            <Plus className="size-4" />
            Add authenticator
            <kbd className="ml-1 hidden rounded border border-primary-foreground/25 bg-primary-foreground/15 px-1.5 py-0.5 text-[10px] font-semibold sm:inline">
              N
            </kbd>
          </Button>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {showSyncBanner && (
          <SyncBanner
            count={localItems.length}
            busy={syncBusy}
            onUpload={() => void handleUploadLocal()}
            onDismiss={() => {
              setDismissedSyncBanner();
              setDismissedSync(true);
            }}
          />
        )}

        {serverError && user && (
          <Alert variant="destructive">
            <TriangleAlert className="size-4" />
            <AlertDescription className="flex flex-wrap items-center gap-3">
              <span>{serverError}</span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 rounded-full"
                onClick={() => setServerRefreshKey((k) => k + 1)}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Card key={i} className="border-border/70">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-40" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          search.trim() ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No authenticators match “{search.trim()}”.
              </CardContent>
            </Card>
          ) : (
            <EmptyState onAdd={() => setAddOpen(true)} />
          )
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {displayItems.map((item, i) => (
              <CredentialCard
                key={item.id}
                item={item}
                now={now}
                index={i}
                onCopy={handleCopy}
                onEdit={onEdit}
                onDelete={setDeleting}
                onShowSecret={onShowSecret}
                onHotpNext={(it) => void handleHotpNext(it)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mobile floating add button */}
      {!loading && (
        <Button
          onClick={() => setAddOpen(true)}
          aria-label="Add authenticator"
          className="fixed bottom-5 right-5 z-30 size-14 rounded-full shadow-xl shadow-primary/25 sm:hidden"
          size="icon"
        >
          <Plus className="size-6" />
        </Button>
      )}

      {/* ------------------------- dialogs ------------------------- */}

      <AddCredentialDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={handleAdd}
      />

      <EditCredentialDialog
        item={editing}
        initialSecret={editingSecret}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setEditingSecret(null);
          }
        }}
        onSave={handleEdit}
      />

      <SecretDialog
        item={secretItem}
        localSecret={secretLocalValue}
        onOpenChange={(open) => {
          if (!open) {
            setSecretItem(null);
            setSecretLocalValue(null);
          }
        }}
      />

      <PasswordPromptDialog
        open={exportPromptOpen}
        onOpenChange={setExportPromptOpen}
        title="Export backup"
        description="Confirm your password to decrypt and download all of your credentials as a JSON file."
        confirmLabel="Download backup"
        onConfirm={exportServer}
      />

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete “{deleting?.label}”?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.source === "server"
                ? "It will be removed from your account on every device. This cannot be undone."
                : "It will be removed from this browser. This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              disabled={deleteBusy}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteBusy && <Loader2 className="size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
