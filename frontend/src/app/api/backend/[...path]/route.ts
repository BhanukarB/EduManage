import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  backendUrl,
  clearTokenCookies,
  isNearExpiry,
  hasSameOrigin,
  refreshTokens,
  setTokenCookies,
} from "@/lib/auth-server";

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(request: NextRequest, context: RouteContext) {
  if (!["GET", "HEAD"].includes(request.method) && !hasSameOrigin(request)) {
    return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  }

  const jar = await cookies();
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;
  let accessToken = jar.get(ACCESS_COOKIE)?.value;
  let rotatedPair: { accessToken: string; refreshToken: string } | null = null;

  if ((!accessToken || isNearExpiry(accessToken)) && refreshToken) {
    try {
      rotatedPair = await refreshTokens(refreshToken);
    } catch {
      return NextResponse.json({ message: "The sign-in service is temporarily unavailable." }, { status: 503 });
    }
    accessToken = rotatedPair?.accessToken;
  }

  if (!accessToken) {
    const response = NextResponse.json({ message: "Your session has expired. Please sign in again." }, { status: 401 });
    clearTokenCookies(response);
    return response;
  }

  const { path } = await context.params;
  if (path.some((segment) => !/^[a-zA-Z0-9._~-]+$/.test(segment) || segment === "." || segment === "..")) {
    return NextResponse.json({ message: "Invalid API path." }, { status: 400 });
  }
  const target = new URL(backendUrl(path.join("/")));
  target.search = request.nextUrl.search;

  const send = (token: string) => {
    const headers = new Headers();
    const contentType = request.headers.get("content-type");
    const accept = request.headers.get("accept");
    if (contentType) headers.set("content-type", contentType);
    if (accept) headers.set("accept", accept);
    for (const name of ["x-active-role-id", "x-active-org-id", "x-active-branch-id"]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    headers.set("authorization", `Bearer ${token}`);
    return fetch(target, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
      // Streaming request bodies require the Node fetch duplex option.
      ...(request.method !== "GET" && request.method !== "HEAD" ? { duplex: "half" as const } : {}),
      cache: "no-store",
      redirect: "manual",
    });
  };

  try {
    let upstream = await send(accessToken);
    if (upstream.status === 401 && !rotatedPair && refreshToken) {
      rotatedPair = await refreshTokens(refreshToken);
      if (rotatedPair) {
        accessToken = rotatedPair.accessToken;
        upstream = await send(accessToken);
      }
    }

    const response = new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
        "cache-control": "no-store",
      },
    });
    if (rotatedPair) await setTokenCookies(response, rotatedPair);
    if (upstream.status === 401) clearTokenCookies(response);
    return response;
  } catch {
    return NextResponse.json({ message: "The API service is unavailable." }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
