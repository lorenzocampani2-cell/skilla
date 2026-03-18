"use client";
// ============================================================
// SKILLA — Interface Mode Switcher
// Switch tra Normale / Essential / Emergency.
// In modalità Emergency: pannelli grandi, alto contrasto, voice.
// ============================================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore, type InterfaceMode } from "@/lib/store/useAppStore";
import { cn } from "@/lib/utils";

const MODES: { id: InterfaceMode; label: string; emoji: string; desc: string; color: string }[] = [
  {
    id: "normal",
    label: "Normale",
    emoji: "📱",
    desc: "Interfaccia completa",
    color: "#3B82F6",
  },
  {
    id: "essential",
    label: "Essential",
    emoji: "⬜",
    desc: "Solo icone grandi",
    color: "#8B5CF6",
  },
  {
    id: "emergency",
    label: "Emergenza",
    emoji: "🆘",
    desc: "Font 24px+, alto contrasto",
    color: "#EF4444",
  },
];

interface Props {
  compact?: boolean;
}

export function InterfaceModeSwitcher({ compact = false }: Props) {
  const { interfaceMode, setInterfaceMode } = useAppStore();
  const [open, setOpen] = useState(false);

  const current = MODES.find((m) => m.id === interfaceMode) || MODES[0];

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="btn-ghost p-2 rounded-xl text-lg"
          title="Cambia modalità interfaccia"
          aria-label="Modalità interfaccia"
        >
          {current.emoji}
        </button>

        <AnimatePresence>
          {open && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -8 }}
                className="absolute right-0 top-full mt-2 z-50 card p-2 min-w-48
                           shadow-xl"
              >
                {MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => { setInterfaceMode(mode.id); setOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl",
                      "text-left transition-all",
                      interfaceMode === mode.id ? "bg-blue-500/15" : "hover:bg-white/5"
                    )}
                  >
                    <span className="text-xl">{mode.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold"
                         style={{ color: interfaceMode === mode.id ? mode.color : "var(--text-primary)" }}>
                        {mode.label}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {mode.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Versione completa (usata in settings)
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
        Modalità interfaccia
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {MODES.map((mode) => {
          const isActive = interfaceMode === mode.id;
          return (
            <motion.button
              key={mode.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => setInterfaceMode(mode.id)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-2xl border-2",
                "text-center transition-all",
              )}
              style={{
                borderColor: isActive ? mode.color : "var(--border)",
                background: isActive ? `${mode.color}15` : "var(--bg-secondary)",
              }}
            >
              <span className="text-3xl">{mode.emoji}</span>
              <div>
                <p className="font-bold text-sm"
                   style={{ color: isActive ? mode.color : "var(--text-primary)" }}>
                  {mode.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {mode.desc}
                </p>
              </div>
              {isActive && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: mode.color, color: "white" }}>
                  Attiva
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Info modalità emergenza */}
      {interfaceMode === "emergency" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl border-2 border-red-500/50 bg-red-500/10"
        >
          <p className="text-sm font-bold text-red-400 mb-1">
            🆘 Modalità Emergenza attiva
          </p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Font grande (24px+), alto contrasto, bottoni XL.
            Accessibile con guanti o in condizioni difficili.
          </p>
          <button
            onClick={() => {
              const text = "Modalità emergenza attiva. Interfaccia semplificata per massima leggibilità.";
              window.speechSynthesis?.speak(new SpeechSynthesisUtterance(text));
            }}
            className="mt-2 text-xs font-semibold text-red-300 underline"
          >
            🔊 Leggi ad alta voce
          </button>
        </motion.div>
      )}
    </div>
  );
}
