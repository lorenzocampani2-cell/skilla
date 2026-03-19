"use client";
// ============================================================
// SKILLA — AuthProvider
// Gestisce sessione Supabase e sincronizza con Zustand store.
// ============================================================

import React, { useEffect, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/useAppStore";
import type { User } from "@shared/types";

interface AuthContextType {
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInAsGuest: (displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve essere usato dentro AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setCurrentUser } = useAppStore();
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  // Ascolta cambio sessione Supabase
  useEffect(() => {
    // Controlla sessione attiva all'avvio
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await loadOrCreateProfile(session.user.id, session.user);
      }
      setIsLoading(false);
    });

    // Listener per login/logout
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await loadOrCreateProfile(session.user.id, session.user);
        router.push("/app");
      }
      if (event === "SIGNED_OUT") {
        setCurrentUser(null);
        router.push("/");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Carica o crea profilo utente su Supabase
  async function loadOrCreateProfile(
    userId: string,
    authUser: { email?: string; user_metadata?: Record<string, unknown> }
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profile) {
      // Mappa snake_case DB → camelCase TypeScript
      setCurrentUser(mapProfile(profile));
    } else {
      // Prima volta: crea profilo con colonne snake_case (come nel DB)
      const newRow = {
        id: userId,
        username: generateUsername(),
        display_name:
          (authUser.user_metadata?.full_name as string) ||
          (authUser.user_metadata?.name as string) ||
          generateGuestName(),
        avatar: authUser.user_metadata?.avatar_url as string | undefined,
        sport: "other",
        auth_type: authUser.email ? "google" : "guest",
        badges: [],
        preferences: defaultPreferences(),
      };

      const { data, error } = await supabase
        .from("profiles")
        .insert(newRow)
        .select()
        .single();

      if (error) console.error("[auth] insert profile error:", error.message);

      // Anche se il DB fallisce, usiamo i dati dell'auth per entrare nell'app
      setCurrentUser(data ? mapProfile(data) : {
        id: userId,
        username: newRow.username,
        displayName: newRow.display_name,
        avatar: newRow.avatar,
        sport: "other",
        authType: newRow.auth_type as User["authType"],
        badges: [],
        preferences: defaultPreferences(),
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Converte riga DB (snake_case) → User (camelCase)
  function mapProfile(row: Record<string, unknown>): User {
    return {
      id: row.id as string,
      username: row.username as string,
      displayName: row.display_name as string,
      avatar: row.avatar as string | undefined,
      sport: (row.sport as User["sport"]) || "other",
      authType: (row.auth_type as User["authType"]) || "guest",
      badges: (row.badges as User["badges"]) || [],
      preferences: (row.preferences as User["preferences"]) || defaultPreferences(),
      createdAt: row.created_at as string,
      isOnline: row.is_online as boolean | undefined,
      lastSeen: row.last_seen as string | undefined,
    };
  }

  // Login Google OAuth
  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
  }

  // Login Apple OAuth
  async function signInWithApple() {
    await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  // Accesso guest anonimo — usa Supabase anonymous auth
  async function signInAsGuest(displayName?: string) {
    setIsLoading(true);
    try {
      const name = displayName || generateGuestName();

      const { data, error } = await supabase.auth.signInAnonymously({
        options: { data: { full_name: name, is_guest: true } },
      });

      if (error) throw error;
      if (data.user) {
        await loadOrCreateProfile(data.user.id, { user_metadata: { full_name: name } });
        router.push("/app");
      }
    } catch (err) {
      console.error("[auth] guest login error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  // Logout
  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{ signInWithGoogle, signInWithApple, signInAsGuest, signOut, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// --- Helpers ---
function generateUsername(): string {
  return `user_${Math.random().toString(36).slice(2, 8)}`;
}

function generateGuestName(): string {
  const adj = ["Veloce", "Forte", "Agile", "Audace", "Rapido"];
  const noun = ["Atleta", "Rider", "Runner", "Climber", "Sciatore"];
  return `${adj[Math.floor(Math.random() * adj.length)]}${noun[Math.floor(Math.random() * noun.length)]}${Math.floor(Math.random() * 99)}`;
}

function defaultPreferences() {
  return {
    language: "it" as const,
    theme: "dark" as const,
    interfaceMode: "normal" as const,
    notifications: {
      push: true,
      newMessages: true,
      newMembers: true,
      mentions: true,
      sound: true,
    },
    layout: [],
    sport: "other" as const,
    carouselItems: [
      { id: "stats", type: "stats" as const, visible: true, order: 0 },
      { id: "session", type: "session" as const, visible: true, order: 1 },
      { id: "tips", type: "tips" as const, visible: true, order: 2 },
    ],
  };
}
