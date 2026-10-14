"use client";

import { memo, useState } from "react";
import { Check, Copy, MoreVertical, Pencil, QrCode, RefreshCw, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CountdownRing } from "@/components/vault/countdown-ring";
import { avatarGradient, avatarInitial } from "@/lib/visual";
import { splitCodeForDisplay } from "@/lib/totp";
import type { DisplayCredential } from "@/components/vault/vault-types";
import { cn } from "@/lib/utils";

interface Props {
  item: DisplayCredential;
  now: number;
  index: number;
  onCopy: (item: DisplayCredential) => void;
  onEdit: (item: DisplayCredential) => void;
  onDelete: (item: DisplayCredential) => void;
  onShowSecret: (item: DisplayCredential) => void;
  onHotpNext: (item: DisplayCredential) => void;
}

function secondsLeft(item: DisplayCredential, now: number): number {
  if (!item.expiresAt) return 0;
  return Math.max(0, Math.ceil((item.expiresAt - now) / 1000));
}

export const CredentialCard = memo(function CredentialCard({
  item,
  now,
  index,
  onCopy,
  onEdit,
  onDelete,
  onShowSecret,
  onHotpNext,
}: Props) {
  const [copied, setCopied] = useState(false);
  const remaining = secondsLeft(item, now);
  const expiring = item.type === "totp" && remaining <= 5 && remaining > 0;

  const code = item.code;
  const display = code ? splitCodeForDisplay(code) : "· · · · · ·";

  const nonDefaultSettings: string[] = [];
  if (item.algorithm !== "SHA-1") nonDefaultSettings.push(item.algorithm);
  if (item.digits !== 6) nonDefaultSettings.push(`${item.digits} digits`);
  if (item.type === "totp" && item.period !== 30) nonDefaultSettings.push(`${item.period}s`);
  if (item.encoding === "steam") nonDefaultSettings.push("Steam");

  function copy() {
    if (!code) return;
    onCopy(item);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={`${item.label} — tap to copy the current code`}
      onClick={copy}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          copy();
        }
      }}
      style={{ animationDelay: `${Math.min(index * 45, 360)}ms` }}
      className={cn(
        "animate-card-in group relative cursor-pointer border-border/80 bg-card/80 outline-none transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-lg hover:shadow-primary/5",
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring",
        item.source === "local" ? "border-dashed" : "",
      )}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-base font-bold text-white shadow-sm",
                avatarGradient(item.issuer || item.label),
              )}
            >
              {avatarInitial(item.label, item.issuer)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold leading-tight">
                {item.label}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {item.issuer || "Personal"}
                {item.type === "hotp" && (
                  <>
                    {" · "}
                    <span title="Counter-based (HOTP)">HOTP #{item.counter}</span>
                  </>
                )}
              </p>
              {nonDefaultSettings.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {nonDefaultSettings.map((s) => (
                    <Badge
                      key={s}
                      variant="outline"
                      className="px-1.5 py-0 text-[10px] font-medium text-muted-foreground"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()}
                aria-label={`Actions for ${item.label}`}
                className="size-8 shrink-0 rounded-lg text-muted-foreground opacity-60 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
              className="w-44"
            >
              <DropdownMenuItem onClick={() => onEdit(item)} className="cursor-pointer">
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShowSecret(item)} className="cursor-pointer">
                <QrCode className="size-4" />
                Show QR & secret
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(item)}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              copy();
            }}
            aria-label={`Copy code for ${item.label}`}
            className={cn(
              "code-digits inline-flex items-center gap-2 rounded-lg px-1 py-0.5 font-mono text-[26px] font-semibold leading-none tracking-[0.06em] outline-none transition-colors sm:text-[28px]",
              code
                ? expiring
                  ? "text-foreground/55"
                  : "text-foreground"
                : "text-muted-foreground/50",
              "focus-visible:ring-2 focus-visible:ring-ring",
              copied && "animate-code-pulse text-primary",
            )}
          >
            {display}
            {copied ? (
              <Check className="size-4 text-primary" aria-hidden="true" />
            ) : (
              <Copy
                className="size-3.5 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/60"
                aria-hidden="true"
              />
            )}
          </button>

          {item.type === "totp" ? (
            <CountdownRing remaining={remaining} period={item.period} />
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onHotpNext(item);
              }}
              title="Generate the next code (advances the counter)"
              className="h-8 gap-1.5 rounded-full px-3 text-xs"
            >
              <RefreshCw className="size-3.5" />
              Next
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
