"use client";

import Link from "next/link";
import { Github, LogOut, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth-context";
import { SITE } from "@/lib/constants";
import { DeleteAccountDialog } from "@/components/auth/delete-account-dialog";
import { useState } from "react";

export function Header() {
  const { user, loading, openAuthDialog, signOut } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="2FA Authenticator — home"
        >
          <Logo />
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="size-9 rounded-full text-muted-foreground transition-colors hover:text-foreground"
          >
            <a
              href={SITE.authorGithub}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub — source & issues"
              title="GitHub"
            >
              <Github className="size-[18px]" />
            </a>
          </Button>
          <ThemeToggle />

          {loading ? (
            <div className="ml-1 h-9 w-24 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="ml-1 flex h-9 items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-2.5 text-sm font-medium outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring sm:pr-3"
                  aria-label="Account menu"
                >
                  <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold uppercase text-white">
                    {user.username.slice(0, 1)}
                  </span>
                  <span className="hidden max-w-28 truncate sm:inline">
                    {user.username}
                  </span>
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col">
                  <span className="truncate text-sm font-semibold">
                    @{user.username}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Synced to your account
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => void signOut()}
                  className="cursor-pointer"
                >
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4" />
                  Delete account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="ml-1 flex items-center gap-1.5 sm:gap-2">
              <Button
                variant="ghost"
                onClick={() => openAuthDialog("signin")}
                className="h-9 rounded-full px-3 text-sm font-medium sm:px-4"
              >
                Sign in
              </Button>
              <Button
                onClick={() => openAuthDialog("signup")}
                className="h-9 rounded-full px-3.5 text-sm font-semibold shadow-sm transition-transform hover:-translate-y-px active:scale-[0.98] sm:px-5"
              >
                Get started
              </Button>
            </div>
          )}
        </div>
      </div>

      <DeleteAccountDialog open={deleteOpen} onOpenChange={setDeleteOpen} />
    </header>
  );
}
