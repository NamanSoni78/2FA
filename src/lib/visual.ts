/** Deterministic, pleasant gradient tiles for credential avatars. */

const GRADIENTS = [
  "from-emerald-500 to-teal-600",
  "from-amber-400 to-orange-600",
  "from-rose-400 to-red-600",
  "from-fuchsia-500 to-purple-700",
  "from-lime-500 to-green-700",
  "from-teal-400 to-emerald-700",
  "from-orange-400 to-rose-600",
  "from-green-400 to-teal-700",
] as const;

export function avatarGradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}

export function avatarInitial(label: string, issuer?: string | null): string {
  const source = (issuer?.trim() || label?.trim() || "?").trim();
  return source.slice(0, 1).toUpperCase();
}
