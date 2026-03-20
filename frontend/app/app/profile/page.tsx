"use client";

import { useAppStore } from "@/lib/store/useAppStore";
import { useAuth } from "@/components/providers/AuthProvider";
import { motion } from "framer-motion";
import { LogOut, Settings, User, Trophy, Calendar } from "lucide-react";
import Link from "next/link";
import { SPORT_CONFIG } from "@shared/types";

export default function ProfilePage() {
  const { currentUser } = useAppStore();
  const { signOut } = useAuth();

  if (!currentUser) return null;

  const sport = SPORT_CONFIG[currentUser.sport] || SPORT_CONFIG["other"];

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full">
      {/* Avatar e nome */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 flex flex-col items-center gap-3 text-center"
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold"
          style={{ background: "var(--primary)", color: "#fff" }}
        >
          {currentUser.avatar ? (
            <img src={currentUser.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
          ) : (
            currentUser.displayName?.[0]?.toUpperCase() || "?"
          )}
        </div>

        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            {currentUser.displayName}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            @{currentUser.username}
          </p>
        </div>

        <div
          className="px-3 py-1 rounded-full text-sm font-medium"
          style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
        >
          {sport.emoji} {sport.label}
        </div>
      </motion.div>

      {/* Badge */}
      {currentUser.badges?.length > 0 && (
        <div className="card p-4">
          <p className="font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Trophy className="w-4 h-4" /> Badge
          </p>
          <div className="flex flex-wrap gap-2">
            {currentUser.badges.map((b) => (
              <span key={b.id} className="px-2 py-1 rounded-lg text-xs font-medium"
                style={{ background: b.color + "22", color: b.color }}>
                {b.emoji} {b.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="card p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Membro dal {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString("it-IT") : "—"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <User className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Account {currentUser.authType === "google" ? "Google" : currentUser.authType === "guest" ? "Ospite" : currentUser.authType}
          </span>
        </div>
      </div>

      {/* Azioni */}
      <div className="flex flex-col gap-2">
        <Link href="/app/settings" className="card p-4 flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Settings className="w-5 h-5" style={{ color: "var(--primary)" }} />
          <span className="font-medium" style={{ color: "var(--text-primary)" }}>Impostazioni</span>
        </Link>

        <button
          onClick={signOut}
          className="card p-4 flex items-center gap-3 hover:opacity-80 transition-opacity w-full text-left"
        >
          <LogOut className="w-5 h-5 text-red-400" />
          <span className="font-medium text-red-400">Esci dall'account</span>
        </button>
      </div>
    </div>
  );
}
