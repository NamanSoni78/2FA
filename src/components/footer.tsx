import Link from "next/link";
import { Heart } from "lucide-react";
import { Logo } from "@/components/logo";
import { SITE } from "@/lib/constants";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/70 bg-card/40">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <Logo />
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Free two-factor authentication codes — right in your browser, on
              any device.
            </p>
          </div>

          <a
            href={SITE.donateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 px-6 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] dark:from-emerald-500 dark:to-teal-400 dark:text-emerald-950"
            aria-label="Support this project — donate"
          >
            <Heart className="size-4 fill-current transition-transform group-hover:scale-110" />
            Donate
          </a>
        </div>

        <div className="mt-8 border-t border-border/60 pt-6">
          <div className="flex flex-col items-start justify-between gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center">
            <p>
              Made with{" "}
              <span role="img" aria-label="love" className="text-rose-500">
                ❤️
              </span>{" "}
              By Naman •{" "}
              <a
                href={SITE.authorGithub}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground/80 underline-offset-4 transition-colors hover:text-primary hover:underline"
              >
                GitHub Account
              </a>
            </p>
            <nav className="flex items-center gap-4" aria-label="Legal">
              <Link
                href="/terms"
                className="transition-colors hover:text-foreground"
              >
                Terms of Service
              </Link>
              <span aria-hidden="true" className="text-border">
                ·
              </span>
              <Link
                href="/privacy"
                className="transition-colors hover:text-foreground"
              >
                Privacy Policy
              </Link>
            </nav>
          </div>
          <p className="mt-4 text-xs text-muted-foreground/80">
            © {year} 2FA Authenticator. Provided as-is, at your own risk — see
            our Terms of Service. This platform makes no promises or
            guarantees.
          </p>
        </div>
      </div>
    </footer>
  );
}
