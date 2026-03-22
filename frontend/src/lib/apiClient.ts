import { useAuthStore } from "@/store/authStore";
import { API_BASE_URL } from "./config";

function getToken(): string | null {
  return useAuthStore.getState().accessToken;
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token?: string };
    if (!data.access_token) return null;
    useAuthStore.getState().setAccessToken(data.access_token);
    return data.access_token;
  } catch {
    return null;
  }
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  opts?: { retryOn401?: boolean }
): Promise<Response> {
  const retryOn401 = opts?.retryOn401 ?? true;
  const token = getToken();
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && retryOn401) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      useAuthStore.getState().logout();
      if (typeof window !== "undefined") {
        window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
      }
      return res;
    }
    const retryHeaders = new Headers(init.headers);
    retryHeaders.set("Authorization", `Bearer ${refreshed}`);
    return fetch(url, {
      ...init,
      headers: retryHeaders,
      credentials: "include",
    });
  }

  return res;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await apiFetch(path, { method: "GET" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      (body as { error?: string }).error ?? `Request failed: ${res.status}`
    );
  }
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      (data as { error?: string }).error ?? `Request failed: ${res.status}`
    );
  }
  return (await res.json()) as T;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}
