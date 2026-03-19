// ============================================================
// SKILLA — Auth Callback Route Handler
// Scambia il codice OAuth (Google/GitHub) con una sessione Supabase
// e reindirizza l'utente all'app.
// ============================================================

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
  }

  // Redirect alla login con errore
  return NextResponse.redirect(`${origin}/?error=auth_callback_failed`);
}
