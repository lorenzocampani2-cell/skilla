"use client";

import { useAppStore } from "@/lib/store/useAppStore";
import { Settings, Moon, Sun, Globe, Bell, Monitor, Zap, AlertTriangle } from "lucide-react";
import type { Theme, InterfaceMode } from "@/lib/store/useAppStore";
import toast from "react-hot-toast";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative w-11 h-6 rounded-full transition-colors"
      style={{ background: checked ? "var(--primary)" : "var(--surface-2)" }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { currentUser, theme, setTheme, interfaceMode, setInterfaceMode, updateUserPreferences } = useAppStore();

  const notifs = currentUser?.preferences?.notifications;

  function toggleNotif(key: string, value: boolean) {
    updateUserPreferences({ notifications: { ...notifs, [key]: value } as typeof notifs });
  }

  const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: "dark", label: "Scuro", icon: <Moon className="w-4 h-4" /> },
    { value: "light", label: "Chiaro", icon: <Sun className="w-4 h-4" /> },
    { value: "high-contrast", label: "Alto contrasto", icon: <Monitor className="w-4 h-4" /> },
  ];

  const modes: { value: InterfaceMode; label: string; desc: string; icon: React.ReactNode }[] = [
    { value: "normal", label: "Normale", desc: "Interfaccia completa", icon: <Monitor className="w-4 h-4" /> },
    { value: "essential", label: "Essenziale", desc: "Solo elementi principali", icon: <Zap className="w-4 h-4" /> },
    { value: "emergency", label: "Emergenza", desc: "Massima visibilità", icon: <AlertTriangle className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full pb-8">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6" style={{ color: "var(--primary)" }} />
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Impostazioni</h1>
      </div>

      {/* Account */}
      <div className="card p-4 flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
          Account
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>Nome display</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{currentUser?.displayName}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>Username</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>@{currentUser?.username}</p>
          </div>
        </div>
      </div>

      {/* Tema */}
      <div className="card p-4 flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
          Tema
        </p>
        <div className="grid grid-cols-3 gap-2">
          {themes.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-sm transition-all ${
                theme === t.value ? "ring-2 ring-indigo-500" : ""
              }`}
              style={{ background: "var(--surface-2)", color: theme === t.value ? "var(--primary)" : "var(--text-secondary)" }}
            >
              {t.icon}
              <span className="text-xs font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modalità interfaccia */}
      <div className="card p-4 flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
          Modalità interfaccia
        </p>
        <div className="flex flex-col gap-2">
          {modes.map((m) => (
            <button
              key={m.value}
              onClick={() => setInterfaceMode(m.value)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                interfaceMode === m.value ? "ring-2 ring-indigo-500" : ""
              }`}
              style={{ background: "var(--surface-2)" }}
            >
              <span style={{ color: interfaceMode === m.value ? "var(--primary)" : "var(--text-secondary)" }}>
                {m.icon}
              </span>
              <div>
                <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{m.label}</p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{m.desc}</p>
              </div>
              {interfaceMode === m.value && (
                <span className="ml-auto w-2 h-2 rounded-full" style={{ background: "var(--primary)" }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lingua */}
      <div className="card p-4 flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
          Lingua
        </p>
        <div className="flex gap-2">
          {[{ code: "it", label: "🇮🇹 Italiano" }, { code: "en", label: "🇬🇧 English" }].map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                updateUserPreferences({ language: lang.code as "it" | "en" });
                toast.success(`Lingua impostata: ${lang.label}`);
              }}
              className={`flex-1 p-2.5 rounded-xl text-sm font-medium transition-all ${
                (currentUser?.preferences?.language || "it") === lang.code ? "ring-2 ring-indigo-500" : ""
              }`}
              style={{ background: "var(--surface-2)", color: "var(--text-primary)" }}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifiche */}
      <div className="card p-4 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-secondary)" }}>
          <Bell className="inline w-3.5 h-3.5 mr-1" />Notifiche
        </p>
        {[
          { label: "Nuovi messaggi", key: "newMessages" },
          { label: "Nuovi membri", key: "newMembers" },
          { label: "Menzioni", key: "mentions" },
          { label: "Suoni", key: "sound" },
        ].map((item) => {
          const val = notifs?.[item.key as keyof typeof notifs] ?? true;
          return (
            <div key={item.key} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--border)" }}>
              <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{item.label}</p>
              <Toggle checked={!!val} onChange={(v) => toggleNotif(item.key, v)} />
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs" style={{ color: "var(--text-secondary)" }}>
        SKILLA v1.0.0 · Sport Communication Platform
      </p>
    </div>
  );
}
