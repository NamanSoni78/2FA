import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to your 2FA Authenticator account to access your synced two-factor credentials.",
  alternates: { canonical: "/signin" },
};

export default function SignInPage() {
  return <AuthScreen mode="signin" />;
}
