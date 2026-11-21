import "server-only";
import { NextResponse } from "next/server";

export const ACCESS_COOKIE = "cm_access";
export const REFRESH_COOKIE = "cm_refresh";

const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;
const REFRESH_SKEW_SECONDS = 30;

type TokenPair = { accessToken: string; refreshToken: string };

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function backendUrl(path: string) {
  const baseUrl = process.env.BACKEND_API_URL ?? "http://localhost:3003/api";
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\/+/, "")}`;
}

export async function setTokenCookies(response: NextResponse, pair: TokenPair) {
  response.cookies.set(ACCESS_COOKIE, pair.accessToken, cookieOptions(ACCESS_TTL_SECONDS));
  response.cookies.set(REFRESH_COOKIE, pair.refreshToken, cookieOptions(REFRESH_TTL_SECONDS));
}

export function clearTokenCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, "", { ...cookieOptions(0), maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { ...cookieOptions(0), maxAge: 0 });
}

export function isNearExpiry(token: string) {
  try {
    const payload = token.split(".")[1];
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: number };
    return typeof claims.exp !== "number" || claims.exp <= Date.now() / 1000 + REFRESH_SKEW_SECONDS;
  } catch {
    return true;
  }
}

export async function refreshTokens(refreshToken: string): Promise<TokenPair | null> {
  const pending = refreshInFlight.get(refreshToken);
  if (pending) return pending;

  const task = requestTokenRefresh(refreshToken);
  refreshInFlight.set(refreshToken, task);
  try {
    return await task;
  } finally {
    refreshInFlight.delete(refreshToken);
  }
}

const refreshInFlight = new Map<string, Promise<TokenPair | null>>();

async function requestTokenRefresh(refreshToken: string): Promise<TokenPair | null> {
  let response: Response;
  try {
    response = await fetch(backendUrl("auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
  } catch {
    throw new Error("Refresh service unavailable");
  }
  if (!response.ok) return null;
  try {
    const body = (await response.json()) as Partial<TokenPair>;
    if (typeof body.accessToken !== "string" || typeof body.refreshToken !== "string") return null;
    return { accessToken: body.accessToken, refreshToken: body.refreshToken };
  } catch {
    return null;
  }
}

export function hasSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
