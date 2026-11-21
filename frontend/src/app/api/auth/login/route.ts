import { NextResponse } from "next/server";
import { backendUrl, hasSameOrigin, setTokenCookies } from "@/lib/auth-server";

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });

  let credentials: { email?: unknown; password?: unknown };
  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  if (typeof credentials.email !== "string" || typeof credentials.password !== "string") {
    return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
  }

  try {
    const upstream = await fetch(backendUrl("auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email: credentials.email, password: credentials.password }),
      cache: "no-store",
    });
    const body = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      const message = upstream.status === 401
        ? "The email or password you entered is incorrect."
        : upstream.status >= 500
          ? "Sign-in service is temporarily unavailable."
          : typeof body?.message === "string" ? body.message : "Unable to sign in.";
      return NextResponse.json({ message }, { status: upstream.status });
    }

    if (typeof body?.accessToken !== "string" || typeof body?.refreshToken !== "string") {
      return NextResponse.json({ message: "The sign-in service returned an invalid response." }, { status: 502 });
    }

    const response = NextResponse.json({ ok: true });
    await setTokenCookies(response, { accessToken: body.accessToken, refreshToken: body.refreshToken });
    return response;
  } catch {
    return NextResponse.json({ message: "Sign-in service is unavailable." }, { status: 502 });
  }
}
