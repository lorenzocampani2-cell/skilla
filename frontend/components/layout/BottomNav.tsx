"use client";
// ============================================================
// SKILLA — Bottom Navigation (mobile)
// Frosted glass, pill indicator, design Spotify/Discord.
// ============================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { MessageSquare, Map, User, Compass, Radio } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/app",          label: "Esplora", icon: Compass,       emoji: "🏠" },
  { href: "/app/chat",     label: "Chat",    icon: MessageSquare, emoji: "💬" },
  { href: "/app/rooms",    label: "Voce",    icon: Radio,         emoji: "🎙️" },
  { href: "/app/map",      label: "Mappa",   icon: Map,           emoji: "🗺️" },
  { href: "/app/profile",  label: "Profilo", icon: User,          emoji: "👤" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { totalUnread, interfaceMode } = useAppStore();
  const unread = totalUnread();
  const isEmergency = interfaceMode === "emergency";

  return (
    <nav
      className="bottom-nav"
      role="navigation"
      aria-label="Navigazione principale"
    >
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/app" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1",
              "transition-all duration-200 select-none",
              isEmergency ? "px-5 py-3 min-w-[56px]" : "px-3 py-2 min-w-[48px]"
            )}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
          >
            {/* Pill indicator quando attivo */}
            {isActive && !isEmergency && (
              <motion.div
                layoutId="nav-pill"
                className="absolute inset-0 rounded-2xl"
                style={{ background: "var(--primary-glow)" }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}

            {/* Badge unread — solo su Chat */}
            {item.href === "/app/chat" && unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-0.5 right-0.5 z-10
                           min-w-[18px] h-[18px] px-1 rounded-full
                           bg-red-500 text-white text-[9px] font-black
                           flex items-center justify-center leading-none"
              >
                {unread > 99 ? "99+" : unread}
              </motion.span>
            )}

            {/* Icona */}
            <div className="relative z-10">
              {isEmergency ? (
                <span className="text-3xl">{item.emoji}</span>
              ) : (
                <item.icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  style={{
                    color: isActive ? "var(--primary)" : "var(--text-muted)",
                    filter: isActive
                      ? "drop-shadow(0 0 5px var(--primary))"
                      : "none",
                    transition: "all 180ms ease",
                  }}
                />
              )}
            </div>

            {/* Label */}
            <span
              className={cn(
                "relative z-10 leading-none",
                isEmergency ? "text-base font-bold" : "text-[10px] font-semibold"
              )}
              style={{
                color: isActive ? "var(--primary)" : "var(--text-muted)",
                transition: "color 180ms ease",
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
