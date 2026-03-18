"use client";
// ============================================================
// SKILLA — Chat Admin Panel
// Gestione chat: membri, permessi, muto, espulsione, promozione.
// ============================================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Shield, VolumeX, UserX, Crown, Settings,
  Users, Pin, Download, Trash2, Lock, Unlock
} from "lucide-react";
import { useSocket } from "@/components/providers/SocketProvider";
import { useAppStore } from "@/lib/store/useAppStore";
import { SPORT_CONFIG } from "@/../../shared/types";
import type { Chat, ChatMember } from "@/../../shared/types";
import { cn, stringToColor, getInitials, timeAgo } from "@/lib/utils";
import toast from "react-hot-toast";

interface Props {
  chat: Chat;
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

type Tab = "members" | "settings" | "pinned";

export function ChatAdminPanel({ chat, isOpen, onClose, isAdmin }: Props) {
  const [tab, setTab] = useState<Tab>("members");
  const [settings, setSettings] = useState(chat.settings);
  const { socket } = useSocket();
  const { currentUser } = useAppStore();

  const members = chat.members?.filter((m) => !m.isExpelled) || [];

  function muteUser(userId: string, duration?: number) {
    socket?.emit("member:mute", { userId, chatId: chat.id, duration });
    toast.success(`Utente silenziato${duration ? ` per ${duration} min` : ""}`);
  }

  function expelUser(userId: string) {
    if (confirm("Vuoi rimuovere questo utente dalla chat?")) {
      socket?.emit("member:expel", { userId, chatId: chat.id });
      toast.success("Utente rimosso");
    }
  }

  function promoteUser(userId: string) {
    socket?.emit("member:promote", { userId, chatId: chat.id });
    toast.success("Utente promosso ad admin");
  }

  function demoteUser(userId: string) {
    socket?.emit("member:demote", { userId, chatId: chat.id });
    toast.success("Admin retrocesso a membro");
  }

  function updateSettings(key: string, value: unknown) {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings as typeof settings);
    socket?.emit("chat:update-settings", { chatId: chat.id, settings: newSettings });
    toast.success("Impostazioni aggiornate");
  }

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm flex flex-col"
        style={{ background: "var(--bg-card)", borderLeft: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b"
             style={{ borderColor: "var(--border)" }}>
          <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {isAdmin ? "🛡️ Pannello Admin" : "ℹ️ Info Chat"}
          </h3>
          <button onClick={onClose} className="btn-ghost p-2 rounded-xl">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
          {[
            { id: "members" as Tab, label: "Membri", icon: Users },
            { id: "pinned" as Tab, label: "Pinnati", icon: Pin },
            ...(isAdmin ? [{ id: "settings" as Tab, label: "Impostazioni", icon: Settings }] : []),
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2",
                "py-3 text-sm font-semibold transition-all border-b-2",
              )}
              style={{
                borderColor: tab === id ? "var(--accent)" : "transparent",
                color: tab === id ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Contenuto tab */}
        <div className="flex-1 overflow-auto touch-scroll p-4">

          {/* ── Tab Membri ── */}
          {tab === "members" && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold uppercase tracking-wider mb-2"
                 style={{ color: "var(--text-muted)" }}>
                {members.length} membri
              </p>
              {members.map((member) => (
                <MemberRow
                  key={member.userId}
                  member={member}
                  chatAdminIds={chat.adminIds}
                  currentUserId={currentUser?.id || ""}
                  isAdmin={isAdmin}
                  onMute={muteUser}
                  onExpel={expelUser}
                  onPromote={promoteUser}
                  onDemote={demoteUser}
                />
              ))}
            </div>
          )}

          {/* ── Tab Pinnati ── */}
          {tab === "pinned" && (
            <div className="flex flex-col gap-3">
              {chat.pinnedMessageIds?.length === 0 ? (
                <div className="text-center py-8">
                  <Pin size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Nessun messaggio pinnato
                  </p>
                </div>
              ) : (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {chat.pinnedMessageIds?.length} messaggi pinnati
                </p>
              )}
            </div>
          )}

          {/* ── Tab Impostazioni (solo admin) ── */}
          {tab === "settings" && isAdmin && (
            <div className="flex flex-col gap-4">

              {/* Toggle: solo admin scrivono */}
              <SettingToggle
                icon={<Lock size={16} />}
                label="Solo admin possono scrivere"
                description="I membri non possono inviare messaggi"
                value={settings?.onlyAdminsCanWrite || false}
                onChange={(v) => updateSettings("onlyAdminsCanWrite", v)}
              />

              {/* Toggle: solo admin aggiungono */}
              <SettingToggle
                icon={<Users size={16} />}
                label="Solo admin aggiungono membri"
                description="I membri non possono invitare altri"
                value={settings?.onlyAdminsCanAddMembers || false}
                onChange={(v) => updateSettings("onlyAdminsCanAddMembers", v)}
              />

              {/* Azioni admin pericolose */}
              <div className="border-t pt-4 mt-2 flex flex-col gap-2"
                   style={{ borderColor: "var(--border)" }}>
                <p className="text-xs font-bold text-red-400 mb-1">
                  ⚠️ Zona pericolosa
                </p>
                <button
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl
                             text-sm font-semibold text-red-400 transition-all"
                  style={{ background: "rgba(239,68,68,0.1)" }}
                  onClick={() => {
                    if (confirm("Eliminare la chat? L'azione è irreversibile.")) {
                      toast.error("Funzione non ancora disponibile");
                    }
                  }}
                >
                  <Trash2 size={16} />
                  Elimina chat
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ── Componente riga membro ──
function MemberRow({
  member,
  chatAdminIds,
  currentUserId,
  isAdmin,
  onMute,
  onExpel,
  onPromote,
  onDemote,
}: {
  member: ChatMember;
  chatAdminIds: string[];
  currentUserId: string;
  isAdmin: boolean;
  onMute: (id: string, duration?: number) => void;
  onExpel: (id: string) => void;
  onPromote: (id: string) => void;
  onDemote: (id: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const user = member.user;
  const isMemberAdmin = chatAdminIds.includes(member.userId);
  const isSelf = member.userId === currentUserId;
  const sport = user?.sport ? SPORT_CONFIG[user.sport] : null;

  return (
    <div className="relative">
      <button
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                   text-left transition-all hover:bg-white/5"
        onClick={() => isAdmin && !isSelf && setShowActions(!showActions)}
      >
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center
                     font-bold text-sm flex-shrink-0 relative"
          style={{
            background: stringToColor(member.userId),
            color: "white",
          }}
        >
          {sport?.emoji || getInitials(user?.displayName || "?")}
          {user?.isOnline && (
            <div className="online-dot" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold truncate"
                  style={{ color: "var(--text-primary)" }}>
              {user?.displayName}
              {isSelf && <span className="ml-1 text-xs text-blue-400">(tu)</span>}
            </span>
            {isMemberAdmin && (
              <Crown size={12} className="text-yellow-400 flex-shrink-0" title="Admin" />
            )}
            {member.isMuted && (
              <VolumeX size={12} className="text-red-400 flex-shrink-0" title="Silenziato" />
            )}
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {sport?.emoji} {sport?.label} · Entrato {timeAgo(member.joinedAt)}
          </p>
        </div>
      </button>

      {/* Menu azioni admin */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-14 overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 py-2 px-2">
              {/* Muto */}
              <button
                onClick={() => { onMute(member.userId, 60); setShowActions(false); }}
                className="chip hover:bg-yellow-500/20 hover:text-yellow-400 cursor-pointer"
              >
                <VolumeX size={11} /> Muta 1h
              </button>
              <button
                onClick={() => { onMute(member.userId); setShowActions(false); }}
                className="chip hover:bg-yellow-500/20 hover:text-yellow-400 cursor-pointer"
              >
                <VolumeX size={11} /> Muta ∞
              </button>

              {/* Promuovi/Demote */}
              {isMemberAdmin ? (
                <button
                  onClick={() => { onDemote(member.userId); setShowActions(false); }}
                  className="chip hover:bg-purple-500/20 hover:text-purple-400 cursor-pointer"
                >
                  <Shield size={11} /> Rimuovi admin
                </button>
              ) : (
                <button
                  onClick={() => { onPromote(member.userId); setShowActions(false); }}
                  className="chip hover:bg-blue-500/20 hover:text-blue-400 cursor-pointer"
                >
                  <Crown size={11} /> Promuovi
                </button>
              )}

              {/* Espelli */}
              <button
                onClick={() => { onExpel(member.userId); setShowActions(false); }}
                className="chip hover:bg-red-500/20 hover:text-red-400 cursor-pointer"
              >
                <UserX size={11} /> Espelli
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Componente toggle impostazione ──
function SettingToggle({
  icon,
  label,
  description,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl"
         style={{ background: "var(--bg-secondary)" }}>
      <div className="flex items-start gap-3 flex-1">
        <span style={{ color: "var(--text-secondary)" }}>{icon}</span>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {label}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {description}
          </p>
        </div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={cn(
          "relative w-12 h-6 rounded-full transition-all flex-shrink-0",
          value ? "bg-blue-500" : "bg-gray-600"
        )}
        role="switch"
        aria-checked={value}
      >
        <motion.div
          animate={{ x: value ? 24 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
        />
      </button>
    </div>
  );
}
