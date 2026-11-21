import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { REFRESH_COOKIE, clearTokenCookies, hasSameOrigin, refreshTokens, setTokenCookies } from "@/lib/auth-server";

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  const refreshToken = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return NextResponse.json({ message: "Your session has expired." }, { status: 401 });

  let pair: Awaited<ReturnType<typeof refreshTokens>>;
  try {
    pair = await refreshTokens(refreshToken);
  } catch {
    return NextResponse.json({ message: "The sign-in service is temporarily unavailable." }, { status: 503 });
  }
  if (!pair) {
    const response = NextResponse.json({ message: "Your session has expired. Please sign in again." }, { status: 401 });
    clearTokenCookies(response);
    return response;
  }

  const response = NextResponse.json({ ok: true });
  await setTokenCookies(response, pair);
  return response;
}
