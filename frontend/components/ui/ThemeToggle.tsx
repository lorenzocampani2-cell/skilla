"use client";
// ============================================================
// SKILLA — Theme Toggle
// Switch rapido: dark / light / high-contrast.
// ============================================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Eye } from "lucide-react";
import { useAppStore, type Theme } from "@/lib/store/useAppStore";

const THEMES: { id: Theme; label: string; icon: typeof Moon }[] = [
  { id: "dark", label: "Scuro", icon: Moon },
  { id: "light", label: "Chiaro", icon: Sun },
  { id: "high-contrast", label: "Alto Contrasto", icon: Eye },
];

export function ThemeToggle() {
  const { theme, setTheme } = useAppStore();
  const [open, setOpen] = useState(false);

  const current = THEMES.find((t) => t.id === theme) || THEMES[0];
  const Icon = current.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="btn-ghost p-2 rounded-xl"
        aria-label="Cambia tema"
      >
        <Icon size={18} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -8 }}
              className="absolute right-0 top-full mt-2 z-50 card p-2 min-w-44 shadow-xl"
            >
              {THEMES.map((t) => {
                const TIcon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => { setTheme(t.id); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                               text-left transition-all hover:bg-white/5"
                    style={{ color: theme === t.id ? "var(--accent)" : "var(--text-primary)" }}
                  >
                    <TIcon size={16} />
                    <span className="text-sm font-medium">{t.label}</span>
                    {theme === t.id && <span className="ml-auto text-xs">✓</span>}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
