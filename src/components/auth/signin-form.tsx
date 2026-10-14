"use client";

import { useState } from "react";
import { Loader2, LogIn, User, KeyRound, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api, apiError } from "@/lib/client-api";
import { validateUsername, validatePassword } from "@/lib/validate";
import { useAuth } from "@/components/auth-context";

export function SignInForm({ onSuccess }: { onSuccess?: () => void }) {
  const { refresh } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);

    const u = validateUsername(username);
    if (!u.ok) return setError(u.error!);
    const p = validatePassword(password);
    if (!p.ok) return setError(p.error!);

    setBusy(true);
    const res = await api<{ user: { username: string } }>("/api/auth/signin", {
      method: "POST",
      body: JSON.stringify({ username: u.value, password: p.value }),
    });
    setBusy(false);

    if (!res.ok) {
      setError(apiError(res.data, "Could not sign in."));
      return;
    }
    await refresh();
    toast.success("Welcome back!", {
      description: `Signed in as @${(res.data as { user: { username: string } }).user.username}.`,
    });
    onSuccess?.();
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="signin-username">Username</Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signin-username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            className="pl-9"
            placeholder="your-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signin-password">Password</Label>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signin-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="pl-9 pr-10"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={busy}
        className="h-11 w-full font-semibold shadow-sm transition-transform hover:-translate-y-px active:scale-[0.99]"
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <LogIn className="size-4" />
        )}
        Sign in
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Lost your password? Accounts have no recovery — your data cannot be
        restored.
      </p>
    </form>
  );
}
