"use client";
// ============================================================
// SKILLA — QR Code Modal
// Genera e mostra QR code per invitare persone in una chat.
// ============================================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { X, Copy, Clock, RefreshCw } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import toast from "react-hot-toast";

interface QRData {
  inviteLink: string;
  qrCode: string;
  token: string;
  expiresAt: string | null;
  chatName: string;
}

interface Props {
  chatId: string;
  chatName: string;
  onClose: () => void;
}

export function QRCodeModal({ chatId, chatName, onClose }: Props) {
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expiry, setExpiry] = useState<"never" | "1h" | "24h" | "7d">("24h");
  const [copied, setCopied] = useState(false);

  const EXPIRY_OPTIONS = [
    { value: "never", label: "Mai", hours: null },
    { value: "1h", label: "1 ora", hours: 1 },
    { value: "24h", label: "24 ore", hours: 24 },
    { value: "7d", label: "7 giorni", hours: 168 },
  ] as const;

  useEffect(() => {
    generateQR();
  }, []);

  async function generateQR() {
    setIsLoading(true);
    try {
      const selected = EXPIRY_OPTIONS.find((o) => o.value === expiry);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/qr/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await getToken()}`,
          },
          body: JSON.stringify({
            chatId,
            expiresInHours: selected?.hours || null,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setQrData(data.data);
      } else {
        toast.error(data.error || "Errore generazione QR");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!qrData) return;
    const success = await copyToClipboard(qrData.inviteLink);
    if (success) {
      setCopied(true);
      toast.success("Link copiato!");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-sm mx-auto"
      >
        <div
          className="card p-6 flex flex-col gap-5"
          style={{ background: "var(--bg-card)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                🔗 Invita persone
              </h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {chatName}
              </p>
            </div>
            <button onClick={onClose} className="btn-ghost p-2 rounded-xl">
              <X size={18} />
            </button>
          </div>

          {/* Scadenza */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
              <Clock size={12} className="inline mr-1" />
              Scadenza link
            </p>
            <div className="flex gap-2">
              {EXPIRY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setExpiry(opt.value)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold
                             border-2 transition-all"
                  style={{
                    borderColor: expiry === opt.value ? "var(--accent)" : "var(--border)",
                    background: expiry === opt.value ? "rgba(59,130,246,0.15)" : "var(--bg-secondary)",
                    color: expiry === opt.value ? "var(--accent)" : "var(--text-secondary)",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-4">
            {isLoading ? (
              <div className="w-48 h-48 skeleton rounded-2xl" />
            ) : qrData ? (
              <div className="p-4 rounded-2xl bg-white">
                <QRCodeSVG
                  value={qrData.inviteLink}
                  size={160}
                  level="M"
                  includeMargin={false}
                  fgColor="#0F172A"
                  bgColor="#FFFFFF"
                />
              </div>
            ) : null}

            {/* Link copiabile */}
            {qrData && (
              <div
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border"
                style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
              >
                <span
                  className="text-xs flex-1 truncate font-mono"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {qrData.inviteLink}
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg
                             text-xs font-semibold transition-all"
                  style={{
                    background: copied ? "rgba(16,185,129,0.2)" : "var(--accent)",
                    color: copied ? "#10B981" : "white",
                  }}
                >
                  <Copy size={12} />
                  {copied ? "Copiato!" : "Copia"}
                </button>
              </div>
            )}
          </div>

          {/* Rigenera */}
          <div className="flex gap-2">
            <button
              onClick={generateQR}
              disabled={isLoading}
              className="btn-ghost flex-1 text-sm rounded-xl py-3 flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              Rigenera
            </button>
            <button
              onClick={onClose}
              className="btn-primary flex-1 text-sm rounded-xl py-3"
            >
              Fatto ✓
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

async function getToken(): Promise<string> {
  const { createClientComponentClient } = await import("@supabase/auth-helpers-nextjs");
  const supabase = createClientComponentClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || "";
}
