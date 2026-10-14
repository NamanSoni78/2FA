"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Theme toggle — pure CSS icon swap (no mounted state, no hydration issues).
 * The active icon follows the `dark` class that next-themes sets on <html>.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle light or dark theme"
      title="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="relative size-9 rounded-full text-muted-foreground transition-colors hover:text-foreground"
    >
      <Sun
        className="absolute size-[18px] scale-100 rotate-0 transition-all duration-300 dark:scale-0 dark:-rotate-90 dark:opacity-0"
        aria-hidden="true"
      />
      <Moon
        className="absolute size-[18px] scale-0 rotate-90 opacity-0 transition-all duration-300 dark:scale-100 dark:rotate-0 dark:opacity-100"
        aria-hidden="true"
      />
    </Button>
  );
}
