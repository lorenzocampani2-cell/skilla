// ============================================================
// SKILLA — Supabase Client (Server)
// Usato nelle Server Components e Route Handlers di Next.js
// ============================================================

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export function createServerClient() {
  return createServerComponentClient({ cookies });
}
