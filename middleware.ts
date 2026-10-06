import { NextResponse, type NextRequest } from "next/server";

const ATTRIBUTION_COOKIE = "nxtwave_attribution";

function cleanParam(value: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 128) : null;
}

export function middleware(request: NextRequest) {
  const ref = cleanParam(request.nextUrl.searchParams.get("ref"));
  const utmSource = cleanParam(request.nextUrl.searchParams.get("utm_source"));
  const response = NextResponse.next();

  if (ref || utmSource) {
    response.cookies.set(
      ATTRIBUTION_COOKIE,
      JSON.stringify({
        ref,
        utm_source: utmSource,
        captured_at: new Date().toISOString()
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30,
        path: "/"
      }
    );
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
