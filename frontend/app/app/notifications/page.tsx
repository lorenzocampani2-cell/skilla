"use client";

import { Bell, BellOff } from "lucide-react";
import { motion } from "framer-motion";

export default function NotificationsPage() {
  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="flex items-center gap-3">
        <Bell className="w-6 h-6" style={{ color: "var(--primary)" }} />
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Notifiche</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-10 flex flex-col items-center gap-4 text-center mt-8"
      >
        <BellOff className="w-14 h-14 opacity-30" />
        <p className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
          Nessuna notifica
        </p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Qui appariranno i messaggi, le menzioni e gli aggiornamenti delle chat a cui partecipi.
        </p>
      </motion.div>
    </div>
  );
}
