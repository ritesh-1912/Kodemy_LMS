import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * CORS for browser calls from Vercel → Render (cross-origin).
 * - Exact origins from CORS_ORIGIN (comma-separated)
 * - Any https://*.vercel.app (preview + production deployments) when allowed
 */
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  const listed = (process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (listed.includes(origin)) return true;

  if (process.env.CORS_STRICT === "true") return false;

  try {
    const u = new URL(origin);
    if (u.protocol === "https:" && u.hostname.endsWith(".vercel.app")) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

function corsHeaders(request: NextRequest): Headers {
  const origin = request.headers.get("origin");
  const headers = new Headers();

  if (origin && isAllowedOrigin(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
  }

  headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  headers.set("Vary", "Origin");
  return headers;
}

export function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
  }

  const response = NextResponse.next();
  const h = corsHeaders(request);
  h.forEach((value, key) => {
    response.headers.set(key, value);
  });
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
