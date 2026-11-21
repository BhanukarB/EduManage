import { NextResponse } from "next/server";
import { clearTokenCookies, hasSameOrigin } from "@/lib/auth-server";

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  clearTokenCookies(response);
  return response;
}
