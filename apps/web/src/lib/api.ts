const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function getUserId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("finora_user_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("finora_user_id", id);
  }
  return id;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "X-User-Id": getUserId() },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": getUserId(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}
