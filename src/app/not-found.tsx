import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center sm:py-32">
      <LogoMark className="size-14 opacity-60" />
      <h1 className="mt-6 text-6xl font-extrabold tracking-tight text-gradient">
        404
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        That page doesn&apos;t exist — but your codes are right where you left
        them.
      </p>
      <Button asChild className="mt-8 h-11 rounded-full px-6 font-semibold">
        <Link href="/">Back to the vault</Link>
      </Button>
    </div>
  );
}
