"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, UserPlus, User, KeyRound, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordStrength } from "@/components/auth/password-strength";
import { api, apiError } from "@/lib/client-api";
import { validateUsername, validatePassword } from "@/lib/validate";
import { useAuth } from "@/components/auth-context";

export function SignUpForm({ onSuccess }: { onSuccess?: () => void }) {
  const { refresh } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
    if (password !== confirm) {
      return setError("Passwords do not match.");
    }

    setBusy(true);
    const res = await api<{ user: { username: string } }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ username: u.value, password: p.value }),
    });
    setBusy(false);

    if (!res.ok) {
      setError(apiError(res.data, "Could not create your account."));
      return;
    }
    await refresh();
    toast.success("Account created!", {
      description: "Your credentials will now sync securely to your account.",
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
        <Label htmlFor="signup-username">Username</Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signup-username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            className="pl-9"
            placeholder="3–30 chars: letters, numbers, _ ."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            className="pl-9 pr-10"
            placeholder="At least 8 characters"
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
        <PasswordStrength password={password} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-confirm">Confirm password</Label>
        <Input
          id="signup-confirm"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        {confirm && password && confirm !== password && (
          <p className="text-xs text-destructive">Passwords do not match.</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={busy}
        className="h-11 w-full font-semibold shadow-sm transition-transform hover:-translate-y-px active:scale-[0.99]"
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <UserPlus className="size-4" />
        )}
        Create account
      </Button>

      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        By creating an account, you agree to our{" "}
        <Link
          href="/terms"
          target="_blank"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          target="_blank"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Privacy Policy
        </Link>
        .
      </p>

      <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
        Secrets are encrypted with AES-256-GCM before they touch the database.
        There is no password recovery — store it safely.
      </p>
    </form>
  );
}
