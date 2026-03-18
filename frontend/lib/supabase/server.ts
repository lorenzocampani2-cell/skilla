// ============================================================
// SKILLA — Supabase Client (Server)
// Usato nelle Server Components e Route Handlers di Next.js
// ============================================================

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export function createServerClient() {
  return createServerComponentClient({
    cookies,
    options: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
  });
}
