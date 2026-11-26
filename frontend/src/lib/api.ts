interface PendingRead {
  promise: Promise<unknown>;
  expiresAt: number;
}

const reads = new Map<string, PendingRead>();

function scopedReadKey(path: string): string {
  if (typeof window === "undefined") return path;
  const source = new URLSearchParams(window.location.search);
  const context = ["role", "org", "branch"].map(key => source.get(key) ?? "").join(":");
  return `${context}:${path}`;
}

export function clearApiReads(): void {
  reads.clear();
}

export function readCachedApi<T>(path: string): Promise<T> | undefined {
  const entry = reads.get(scopedReadKey(path));
  return entry && entry.expiresAt > Date.now() ? entry.promise as Promise<T> : undefined;
}

export async function readApi<T>(path: string, maxAgeMs = 0): Promise<T> {
  const existing = readCachedApi<T>(path);
  if (existing) return existing;

  const key = scopedReadKey(path);
  const entry: PendingRead = { promise: request<T>(path), expiresAt: Infinity };
  reads.set(key, entry);
  try {
    const data = await entry.promise as T;
    entry.expiresAt = Date.now() + maxAgeMs;
    return data;
  } finally {
    if (reads.get(key) === entry) {
      if (entry.expiresAt === Infinity || maxAgeMs === 0) reads.delete(key);
      else setTimeout(() => { if (reads.get(key) === entry) reads.delete(key); }, maxAgeMs);
    }
  }
}

export async function api<T>(path: string, init?: RequestInit, invalidate?: readonly string[]): Promise<T> {
  if (!init) return readApi<T>(path);

  try {
    return await request<T>(path, init);
  } finally {
    if (init.method && !["GET", "HEAD"].includes(init.method.toUpperCase())) {
      if (invalidate) for (const key of invalidate) reads.delete(key);
      else clearApiReads();
    }
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const contextHeaders = {
      "x-active-role-id": params.get("role"),
      "x-active-org-id": params.get("org"),
      "x-active-branch-id": params.get("branch"),
    };
    for (const [name, value] of Object.entries(contextHeaders)) if (value) headers.set(name, value);
  }
  if (init?.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await fetch(`/api/backend/${path.replace(/^\/+/, "")}`, {
    ...init,
    cache: "no-store",
    headers,
  });
  const body: unknown = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) clearApiReads();
    const message = typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
      ? body.message
      : "The request could not be completed.";
    throw new Error(message);
  }
  return body as T;
}

export function extractErrorMessage(reason: unknown, fallback: string): string {
  return reason instanceof Error ? reason.message : fallback;
}
