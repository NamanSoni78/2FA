"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, apiError } from "@/lib/client-api";
import { useAuth } from "@/components/auth-context";
import { clearLocalCredentials } from "@/lib/local-store";

export function DeleteAccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    if (busy) return;
    if (!password) {
      setError("Enter your password to confirm.");
      return;
    }
    setBusy(true);
    setError(null);

    const res = await api("/api/account", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    });
    setBusy(false);

    if (!res.ok) {
      setError(apiError(res.data, "Could not delete the account."));
      return;
    }

    clearLocalCredentials();
    await signOut();
    onOpenChange(false);
    setPassword("");
    toast.success("Account deleted", {
      description: "Your account and every stored credential were removed.",
    });
    router.push("/");
    router.refresh();
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <TriangleAlert className="size-5" />
            Delete account permanently?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This erases <strong>@{user?.username}</strong> and{" "}
            <strong>every 2FA credential stored in your account</strong>. There
            is no undo and no recovery. Make sure you have your setup keys
            saved elsewhere if you still need them.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-1">
          <Label htmlFor="delete-password">Confirm your password</Label>
          <Input
            id="delete-password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void confirm();
              }
            }}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void confirm();
            }}
            disabled={busy}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            Delete everything
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
