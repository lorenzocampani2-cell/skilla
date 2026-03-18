"use client";
// ============================================================
// SKILLA — TopBar
// Barra superiore con menu, titolo, switcher interfaccia.
// ============================================================

import { usePathname } from "next/navigation";
import { Menu, Wifi, WifiOff } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useSocket } from "@/components/providers/SocketProvider";
import { InterfaceModeSwitcher } from "@/components/ui/InterfaceModeSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const PAGE_TITLES: Record<string, string> = {
  "/app": "Esplora",
  "/app/chat": "Chat",
  "/app/map": "Mappa",
  "/app/notifications": "Notifiche",
  "/app/profile": "Profilo",
  "/app/settings": "Impostazioni",
};

export function TopBar() {
  const pathname = usePathname();
  const { toggleSidebar } = useAppStore();
  const { isConnected } = useSocket();

  const title = PAGE_TITLES[pathname] || "SKILLA";

  return (
    <header
      className="flex items-center justify-between px-4 border-b z-30"
      style={{
        height: "var(--navbar-height)",
        background: "var(--bg-card)",
        borderColor: "var(--border)",
      }}
    >
      {/* Menu hamburger (mobile) */}
      <button
        onClick={toggleSidebar}
        className="md:hidden btn-ghost p-2 rounded-xl -ml-2"
        aria-label="Apri menu"
      >
        <Menu size={20} />
      </button>

      {/* Titolo pagina */}
      <h1 className="text-lg font-bold md:text-xl"
          style={{ color: "var(--text-primary)" }}>
        {title}
      </h1>

      {/* Azioni destra */}
      <div className="flex items-center gap-2">
        {/* Indicatore connessione real-time */}
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
          style={{
            background: isConnected ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
            color: isConnected ? "#10B981" : "#EF4444",
          }}
          title={isConnected ? "Connesso" : "Disconnesso"}
        >
          {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span className="hidden sm:inline">
            {isConnected ? "Online" : "Offline"}
          </span>
        </div>

        {/* Switcher modalità interfaccia */}
        <InterfaceModeSwitcher compact />

        {/* Toggle tema */}
        <ThemeToggle />
      </div>
    </header>
  );
}
