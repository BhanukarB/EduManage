import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export const ACCESS_COOKIE = "cm_access";
export const REFRESH_COOKIE = "cm_refresh";

export interface JwtClaims {
  roles?: unknown;
  role_names?: unknown;
  email?: unknown;
  orgId?: unknown;
  branchId?: unknown;
  exp?: number;
}

export function decodeTokenClaims(token?: string): JwtClaims | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as JwtClaims;
  } catch {
    return null;
  }
}

export function getRoleNames(claims: JwtClaims | null): string[] {
  if (!claims) return [];
  return [claims.roles, claims.role_names]
    .flatMap((roles) => Array.isArray(roles) ? roles : [])
    .filter((role): role is string => typeof role === "string");
}

interface BranchManagerContext {
  orgId: string;
  branchId: string;
}

interface DashboardContext {
  email?: string;
  superUser: boolean;
  organisationId: string | null;
  manager: BranchManagerContext | null;
}

export async function requireDashboardContext(): Promise<DashboardContext> {
  const jar = await requireAuth();
  const claims = decodeTokenClaims(jar.get(ACCESS_COOKIE)?.value);
  const roles = getRoleNames(claims);
  const orgId = typeof claims?.orgId === "string" ? claims.orgId : null;
  return {
    email: typeof claims?.email === "string" ? claims.email : undefined,
    superUser: roles.includes("super_user") || roles.includes("super_admin"),
    organisationId: roles.includes("org_admin") ? orgId : null,
    manager: roles.includes("branch_manager") && orgId && typeof claims?.branchId === "string"
      ? { orgId, branchId: claims.branchId }
      : null,
  };
}

export async function requireBranchManager(branchId?: string): Promise<BranchManagerContext & { email?: string }> {
  const { manager, email } = await requireDashboardContext();
  if (!manager || (branchId && manager.branchId !== branchId)) redirect("/dashboard");
  return { ...manager, email };
}

export async function requireAuth() {
  const jar = await cookies();
  if (!jar.has(ACCESS_COOKIE) && !jar.has(REFRESH_COOKIE)) redirect("/");
  return jar;
}

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
  const expiry = decodeTokenClaims(token)?.exp;
  return typeof expiry !== "number" || expiry <= Date.now() / 1000 + REFRESH_SKEW_SECONDS;
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
