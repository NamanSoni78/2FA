"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Camera QR scanner (html5-qrcode, dynamically imported so it never weighs
 * down the initial page load). Decodes otpauth:// URIs — or bare secrets.
 */
export function QrScanner({
  onResult,
}: {
  onResult: (decodedText: string) => void;
}) {
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef(onResult);
  const instanceRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    resultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    doneRef.current = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const scanner = new Html5Qrcode("n2fa-qr-reader", { verbose: false });
        instanceRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 230, height: 230 } },
          (decodedText: string) => {
            if (doneRef.current || cancelled) return;
            doneRef.current = true;
            void scanner
              .stop()
              .then(() => scanner.clear())
              .catch(() => undefined);
            resultRef.current(decodedText);
          },
          () => {
            /* per-frame decode misses — ignore */
          },
        );
      } catch {
        if (!cancelled) {
          setError(
            "Could not access the camera. Check permissions — or paste the setup key manually.",
          );
          setActive(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      const scanner = instanceRef.current;
      if (scanner) {
        void scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => undefined);
        instanceRef.current = null;
      }
    };
  }, [active]);

  return (
    <div className="space-y-3">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {active ? (
        <div className="space-y-2">
          <div
            id="n2fa-qr-reader"
            className="mx-auto w-full max-w-[280px] overflow-hidden rounded-xl border border-border bg-black"
          />
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <ScanLine className="size-3.5" />
            Point your camera at the service&apos;s QR code
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-8">
          <Button
            type="button"
            onClick={() => {
              setError(null);
              setActive(true);
            }}
            className="gap-2 rounded-full"
          >
            <Camera className="size-4" />
            Start camera
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            The camera stream stays on your device — we only read the QR text.
          </p>
        </div>
      )}
    </div>
  );
}
