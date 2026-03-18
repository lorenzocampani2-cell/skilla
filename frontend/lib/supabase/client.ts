// ============================================================
// SKILLA — Supabase Client (Browser)
// ============================================================

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Crea client Supabase per componenti React (browser-side)
// Le chiavi vengono da .env.local — mai hardcodarle!
export const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

export default supabase;
