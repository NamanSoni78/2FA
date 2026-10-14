import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Create a free 2FA Authenticator account to sync your two-factor credentials securely across devices.",
  alternates: { canonical: "/signup" },
};

export default function SignUpPage() {
  return <AuthScreen mode="signup" />;
}
