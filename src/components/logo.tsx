import { cn } from "@/lib/utils";

/** Brand mark — a rounded shield with a keyhole. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={cn("size-8", className)}
    >
      <defs>
        <linearGradient id="lg-shield" x1="6" y1="2" x2="42" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="oklch(0.7 0.15 165)" />
          <stop offset="1" stopColor="oklch(0.48 0.13 170)" />
        </linearGradient>
        <linearGradient id="lg-shield-dark" x1="6" y1="2" x2="42" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="oklch(0.85 0.16 163)" />
          <stop offset="1" stopColor="oklch(0.62 0.14 172)" />
        </linearGradient>
      </defs>
      <path
        d="M24 3.5 6.5 9.8c-.6.2-1 .8-1 1.4v11.3c0 9.9 6.6 18.4 16.2 21.3.5.15 1.05.15 1.6 0C32.9 40.9 39.5 32.4 39.5 22.5V11.2c0-.6-.4-1.2-1-1.4L24 3.5Z"
        fill="url(#lg-shield)"
        className="dark:hidden"
      />
      <path
        d="M24 3.5 6.5 9.8c-.6.2-1 .8-1 1.4v11.3c0 9.9 6.6 18.4 16.2 21.3.5.15 1.05.15 1.6 0C32.9 40.9 39.5 32.4 39.5 22.5V11.2c0-.6-.4-1.2-1-1.4L24 3.5Z"
        fill="url(#lg-shield-dark)"
        className="hidden dark:block"
      />
      <circle cx="24" cy="19.5" r="4.2" fill="oklch(0.99 0.005 106)" fillOpacity="0.95" />
      <path
        d="M22.3 22.5h3.4l1.1 8.2a1.8 1.8 0 1 1-3.6 0l1.1-8.2Z"
        fill="oklch(0.99 0.005 106)"
        fillOpacity="0.95"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="size-8" />
      <span className="text-lg font-bold tracking-tight">
        2FA
        <span className="ml-1.5 font-medium text-muted-foreground">
          Authenticator
        </span>
      </span>
    </span>
  );
}
