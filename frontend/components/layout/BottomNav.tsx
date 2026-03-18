"use client";
// ============================================================
// SKILLA — Bottom Navigation (mobile)
// Navigazione principale con icone grandi e badge unread.
// ============================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { MessageSquare, Map, User, Compass, Bell } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/app", label: "Home", icon: Compass, emoji: "🏠" },
  { href: "/app/chat", label: "Chat", icon: MessageSquare, emoji: "💬" },
  { href: "/app/map", label: "Mappa", icon: Map, emoji: "🗺️" },
  { href: "/app/notifications", label: "Avvisi", icon: Bell, emoji: "🔔" },
  { href: "/app/profile", label: "Profilo", icon: User, emoji: "👤" },
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
        const isActive = pathname === item.href ||
          (item.href !== "/app" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 relative",
              "transition-all duration-200 rounded-xl",
              isEmergency
                ? "touch-target-emergency px-4 py-3"
                : "touch-target px-3 py-2"
            )}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
          >
            {/* Indicatore attivo */}
            {isActive && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute inset-0 rounded-xl"
                style={{ background: `${getComputedStyle(document.documentElement).getPropertyValue("--accent")}20` }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}

            {/* Badge unread (solo su Chat) */}
            {item.href === "/app/chat" && unread > 0 && (
              <span className="absolute -top-1 -right-1 z-10
                               min-w-5 h-5 px-1 rounded-full
                               bg-red-500 text-white text-[10px] font-bold
                               flex items-center justify-center">
                {unread > 99 ? "99+" : unread}
              </span>
            )}

            {/* Icona */}
            {isEmergency ? (
              <span className="text-3xl">{item.emoji}</span>
            ) : (
              <item.icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                style={{ color: isActive ? "var(--accent)" : "var(--text-muted)" }}
              />
            )}

            {/* Label */}
            <span
              className={cn(
                "font-medium leading-none",
                isEmergency ? "text-emergency-sm" : "text-[10px]"
              )}
              style={{
                color: isActive ? "var(--accent)" : "var(--text-muted)",
                fontWeight: isActive ? 700 : 500,
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
