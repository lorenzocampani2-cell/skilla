"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, MessageSquare, Users, Trash2, Check } from "lucide-react";
import { useAppStore, type AppNotification } from "@/lib/store/useAppStore";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, markNotificationRead, clearNotifications, unreadNotifications } = useAppStore();
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermissionStatus("unsupported");
    } else {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  async function requestPermission() {
    if (permissionStatus === "unsupported") return;
    const result = await Notification.requestPermission();
    setPermissionStatus(result);
  }

  function handleNotificationClick(n: AppNotification) {
    markNotificationRead(n.id);
    if (n.chatId) router.push(`/app/chat/${n.chatId}`);
  }

  const unread = unreadNotifications();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" style={{ color: "var(--primary)" }} />
          <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Notifiche</h1>
          {unread > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "var(--primary)", color: "white" }}>
              {unread}
            </span>
          )}
        </div>
        {notifications.length > 0 && (
          <button
            onClick={clearNotifications}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-secondary)", background: "var(--surface-2)" }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Cancella tutto
          </button>
        )}
      </div>

      {/* Banner permesso browser */}
      {permissionStatus === "default" && (
        <div className="mx-4 mt-4 p-3 rounded-xl flex items-center justify-between gap-3" style={{ background: "var(--primary)/10", border: "1px solid var(--primary)/30" }}>
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Abilita notifiche browser</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Ricevi notifiche anche quando Skilla non è aperto
            </p>
          </div>
          <button onClick={requestPermission} className="btn-primary text-xs px-3 py-1.5 shrink-0">
            Abilita
          </button>
        </div>
      )}

      {permissionStatus === "denied" && (
        <div className="mx-4 mt-4 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            🔕 Notifiche browser bloccate. Puoi abilitarle dalle impostazioni del browser (icona 🔒 nella barra indirizzi).
          </p>
        </div>
      )}

      {/* Lista notifiche */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        <AnimatePresence>
          {notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4 text-center mt-12"
            >
              <BellOff className="w-14 h-14 opacity-20" />
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Nessuna notifica</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Qui appariranno i messaggi e gli aggiornamenti delle chat.
              </p>
            </motion.div>
          ) : (
            notifications.map((n) => (
              <motion.button
                key={n.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onClick={() => handleNotificationClick(n)}
                className="w-full text-left card p-3 flex items-start gap-3 transition-all hover:opacity-90"
                style={{
                  borderLeft: n.read ? "none" : "3px solid var(--primary)",
                  opacity: n.read ? 0.7 : 1,
                }}
              >
                {/* Icona tipo */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "var(--surface-2)" }}
                >
                  {n.type === "message" ? (
                    <MessageSquare className="w-4 h-4" style={{ color: "var(--primary)" }} />
                  ) : (
                    <Users className="w-4 h-4" style={{ color: "var(--primary)" }} />
                  )}
                </div>

                {/* Testo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {n.title}
                    </p>
                    {n.read && <Check className="w-3.5 h-3.5 shrink-0 opacity-40" />}
                  </div>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
                    {n.body}
                  </p>
                  <p className="text-[10px] mt-1 opacity-50" style={{ color: "var(--text-secondary)" }}>
                    {formatDistanceToNow(n.createdAt, { addSuffix: true, locale: it })}
                  </p>
                </div>
              </motion.button>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
