import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const BOT_UA_RE =
  /Googlebot|bingbot|Baiduspider|YandexBot|DuckDuckBot|Slurp|facebookexternalhit|LinkedInBot|Twitterbot|applebot|AhrefsBot|SemrushBot/i;

export async function middleware(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return;
  }

  // Skip Supabase auth session refresh for search-engine crawlers
  // to avoid cookie/redirect issues that cause indexing failures
  const ua = request.headers.get("user-agent") || "";
  if (BOT_UA_RE.test(ua)) {
    return NextResponse.next();
  }

  const { response } = await updateSession(request);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/cron/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
