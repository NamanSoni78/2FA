"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth, type AuthDialogMode } from "@/components/auth-context";
import { SignInForm } from "@/components/auth/signin-form";
import { SignUpForm } from "@/components/auth/signup-form";

export function AuthDialog() {
  const { dialogMode, closeAuthDialog, openAuthDialog } = useAuth();
  const open = dialogMode !== null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && closeAuthDialog()}>
      <DialogContent className="max-w-[400px] p-0 outline-none">
        <DialogHeader className="space-y-1.5 px-6 pb-4 pt-6">
          <DialogTitle className="text-xl">
            {dialogMode === "signup" ? "Create your account" : "Welcome back"}
          </DialogTitle>
          <DialogDescription>
            {dialogMode === "signup"
              ? "Sync your 2FA codes securely across browsers and devices."
              : "Sign in to access your synced 2FA credentials."}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          {dialogMode === "signin" ? (
            <SignInForm onSuccess={closeAuthDialog} />
          ) : (
            <SignUpForm onSuccess={closeAuthDialog} />
          )}

          <p className="mt-5 border-t border-border/70 pt-4 text-center text-sm text-muted-foreground">
            {dialogMode === "signin" ? (
              <>
                No account yet?{" "}
                <button
                  type="button"
                  onClick={() => openAuthDialog("signup")}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => openAuthDialog("signin")}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
