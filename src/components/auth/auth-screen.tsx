"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInForm } from "@/components/auth/signin-form";
import { SignUpForm } from "@/components/auth/signup-form";

/** Shared shell for the /signin and /signup pages. */
export function AuthScreen({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();

  const onSuccess = useCallback(() => {
    router.push("/");
    router.refresh();
  }, [router]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-12 sm:py-16">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to the app
      </Link>

      <Card className="animate-fade-up border-border/70 shadow-sm">
        <CardHeader className="space-y-1.5">
          <CardTitle className="text-2xl">
            {mode === "signin" ? "Sign in" : "Create your account"}
          </CardTitle>
          <CardDescription>
            {mode === "signin"
              ? "Access your synced 2FA credentials."
              : "Sync your 2FA credentials securely across browsers and devices."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "signin" ? (
            <SignInForm onSuccess={onSuccess} />
          ) : (
            <SignUpForm onSuccess={onSuccess} />
          )}

          <p className="mt-5 border-t border-border/70 pt-4 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                No account yet?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Create one
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link
                  href="/signin"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </>
            )}
          </p>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        You can also use the full app without an account — credentials stay in
        your browser.
      </p>
    </div>
  );
}
