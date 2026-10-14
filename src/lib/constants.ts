/** Site-wide configuration shared by UI, SEO metadata, and emails-free things. */

export const SITE = {
  name: "2FA Authenticator",
  shortName: "2FA",
  title: "2FA Authenticator — Free Two-Factor Code Generator & Manager",
  description:
    "Free browser-based two-factor authentication app. Add your TOTP/HOTP setup keys, generate 2FA codes instantly on desktop or mobile, keep them on your device or sync them to your encrypted account.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://2fa.namansoni.in",
  author: "Naman",
  authorGithub: "https://github.com/NamanSoni78",
  donateUrl: "https://payment.namansoni.in/payment",
  keywords: [
    "2FA authenticator",
    "two-factor authentication",
    "TOTP generator",
    "HOTP",
    "2FA codes online",
    "authenticator app",
    "one-time password",
    "OTP generator",
    "free authenticator",
    "2FA without phone",
    "backup 2FA codes",
    "authenticator web app",
  ],
} as const;

/** Demo secret used on the landing hero — rotates a real code, obviously fake. */
export const DEMO_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
