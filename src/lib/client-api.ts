/** Tiny fetch helper for the client — always JSON, never throws for HTTP errors. */

export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data: T | { error: string };
}

export async function api<T>(
  url: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    const data = (await res.json().catch(() => ({}))) as T | { error: string };
    return { ok: res.ok, status: res.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { error: "Network error — check your connection and try again." },
    };
  }
}

export function apiError(data: unknown, fallback = "Something went wrong."): string {
  if (typeof data === "object" && data !== null && "error" in data) {
    const e = (data as { error?: unknown }).error;
    if (typeof e === "string" && e) return e;
  }
  return fallback;
}

/** Triggers a JSON file download in the browser. */
export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
