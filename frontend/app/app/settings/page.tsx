"use client";

import { useAppStore } from "@/lib/store/useAppStore";
import { Settings, Moon, Sun, Globe, Bell } from "lucide-react";

export default function SettingsPage() {
  const { currentUser, interfaceMode } = useAppStore();

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6" style={{ color: "var(--primary)" }} />
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Impostazioni</h1>
      </div>

      <div className="card p-4 flex flex-col gap-4">
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

      <div className="card p-4 flex flex-col gap-4">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
          Interfaccia
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>Tema</p>
          </div>
          <span className="text-sm px-2 py-1 rounded-lg" style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>
            {currentUser?.preferences?.theme || "dark"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>Lingua</p>
          </div>
          <span className="text-sm px-2 py-1 rounded-lg" style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>
            {currentUser?.preferences?.language === "it" ? "Italiano" : "English"}
          </span>
        </div>
      </div>

      <div className="card p-4">
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-secondary)" }}>
          Notifiche
        </p>
        {[
          { label: "Nuovi messaggi", key: "newMessages" },
          { label: "Nuovi membri", key: "newMembers" },
          { label: "Menzioni", key: "mentions" },
          { label: "Suoni", key: "sound" },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between py-2">
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>{item.label}</p>
            <span className="text-xs px-2 py-1 rounded-full" style={{
              background: currentUser?.preferences?.notifications?.[item.key as keyof typeof currentUser.preferences.notifications]
                ? "var(--primary)" : "var(--surface-2)",
              color: "#fff"
            }}>
              {currentUser?.preferences?.notifications?.[item.key as keyof typeof currentUser.preferences.notifications] ? "On" : "Off"}
            </span>
          </div>
        ))}
      </div>

      <p className="text-center text-xs" style={{ color: "var(--text-secondary)" }}>
        SKILLA v1.0.0 — Sport Communication Platform
      </p>
    </div>
  );
}
