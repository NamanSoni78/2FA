"use client";

import { useRef } from "react";
import { Database, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  onExport: () => void;
  onImportFile: (file: File) => void;
}

/** Export / import backup menu. */
export function DataMenu({ onExport, onImportFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onImportFile(file);
          e.target.value = "";
        }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label="Backup data — export or import"
            title="Export / import backup"
            className="size-10 shrink-0 rounded-full"
          >
            <Database className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Backup</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onExport} className="cursor-pointer gap-2">
            <Download className="size-4" />
            Export JSON backup
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => inputRef.current?.click()}
            className="cursor-pointer gap-2"
          >
            <Upload className="size-4" />
            Import JSON backup
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
