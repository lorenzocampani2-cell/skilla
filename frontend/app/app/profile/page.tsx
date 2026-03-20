"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useAuth } from "@/components/providers/AuthProvider";
import { motion } from "framer-motion";
import { LogOut, Settings, User, Trophy, Calendar, Edit2, Check, X } from "lucide-react";
import Link from "next/link";
import { SPORT_CONFIG } from "@shared/types";
import { getToken } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { currentUser, setCurrentUser } = useAppStore();
  const { signOut } = useAuth();

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [sport, setSport] = useState<string>(currentUser?.sport || "other");
  const [saving, setSaving] = useState(false);

  if (!currentUser) return null;

  const sportCfg = SPORT_CONFIG[currentUser.sport as keyof typeof SPORT_CONFIG] || SPORT_CONFIG["other"];

  async function saveProfile() {
    if (!displayName.trim()) return toast.error("Il nome non può essere vuoto");
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ displayName: displayName.trim(), sport }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      if (currentUser) {
        setCurrentUser({ ...currentUser, displayName: updated.displayName || displayName.trim(), sport: updated.sport || sport } as typeof currentUser);
      }
      toast.success("Profilo aggiornato!");
      setEditing(false);
    } catch {
      toast.error("Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setDisplayName(currentUser?.displayName || "");
    setSport(currentUser?.sport || "other");
    setEditing(false);
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full">
      {/* Avatar e nome */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 flex flex-col items-center gap-3 text-center"
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold overflow-hidden"
          style={{ background: "var(--primary)", color: "#fff" }}
        >
          {currentUser.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentUser.avatar} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            currentUser.displayName?.[0]?.toUpperCase() || "?"
          )}
        </div>

        {editing ? (
          <div className="w-full flex flex-col gap-3">
            <input
              className="input w-full text-center"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={30}
              placeholder="Il tuo nome"
            />
            <div>
              <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>Sport principale</p>
              <div className="grid grid-cols-4 gap-1.5">
                {Object.entries(SPORT_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setSport(key)}
                    className={`p-2 rounded-xl text-center text-xs transition-all ${sport === key ? "ring-2 ring-indigo-500" : ""}`}
                    style={{ background: "var(--surface-2)" }}
                  >
                    <div className="text-lg">{cfg.emoji}</div>
                    <div className="text-[10px] mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>{cfg.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={cancelEdit} className="flex-1 card p-2 flex items-center justify-center gap-1.5 text-sm">
                <X className="w-4 h-4" /> Annulla
              </button>
              <button onClick={saveProfile} disabled={saving} className="flex-1 btn-primary p-2 flex items-center justify-center gap-1.5 text-sm">
                <Check className="w-4 h-4" /> {saving ? "Salvo..." : "Salva"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                {currentUser.displayName}
              </h1>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                @{currentUser.username}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
              >
                {sportCfg.emoji} {sportCfg.label}
              </div>
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </motion.div>

      {/* Badge */}
      {currentUser.badges?.length > 0 && (
        <div className="card p-4">
          <p className="font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Trophy className="w-4 h-4" /> Badge
          </p>
          <div className="flex flex-wrap gap-2">
            {currentUser.badges.map((b) => (
              <span
                key={b.id}
                className="px-2 py-1 rounded-lg text-xs font-medium"
                style={{ background: b.color + "22", color: b.color }}
              >
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
            Account{" "}
            {currentUser.authType === "google"
              ? "Google"
              : currentUser.authType === "guest"
              ? "Ospite"
              : currentUser.authType}
          </span>
        </div>
      </div>

      {/* Azioni */}
      <div className="flex flex-col gap-2">
        <Link
          href="/app/settings"
          className="card p-4 flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
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
