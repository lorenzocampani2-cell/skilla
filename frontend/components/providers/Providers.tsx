"use client";
// ============================================================
// SKILLA — Providers
// Avvolge l'app con tutti i context necessari.
// Separati in un Client Component perché usano hooks.
// ============================================================

import React, { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useAppStore } from "@/lib/store/useAppStore";
import { AuthProvider } from "./AuthProvider";
import { SocketProvider } from "./SocketProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const { theme, interfaceMode } = useAppStore();

  // Applica tema e modalità all'HTML al primo render
  useEffect(() => {
    const root = document.documentElement;

    // Reset classi tema
    root.classList.remove("dark", "light", "high-contrast");
    root.classList.add(theme);

    // Reset modalità interfaccia
    root.classList.remove("essential", "emergency");
    if (interfaceMode !== "normal") {
      root.classList.add(interfaceMode);
    }
  }, [theme, interfaceMode]);

  return (
    <AuthProvider>
      <SocketProvider>
        {children}

        {/* Notifiche toast globali */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "500",
              boxShadow:
                "0 10px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)",
            },
            success: {
              iconTheme: { primary: "#10B981", secondary: "white" },
            },
            error: {
              iconTheme: { primary: "#EF4444", secondary: "white" },
            },
          }}
        />
      </SocketProvider>
    </AuthProvider>
  );
}
