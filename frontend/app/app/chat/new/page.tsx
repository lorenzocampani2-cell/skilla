"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { ArrowLeft, Globe, Lock, Plus } from "lucide-react";
import { SPORT_CONFIG } from "@shared/types";
import { getToken } from "@/lib/utils";
import toast from "react-hot-toast";

export default function NewChatPage() {
  const router = useRouter();
  const { currentUser, addChat } = useAppStore();
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [sport, setSport] = useState<string>(currentUser?.sport || "other");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return toast.error("Dai un nome alla chat!");
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chats`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), isPublic, sport }),
      });
      if (!res.ok) throw new Error(await res.text());
      const chat = await res.json();
      addChat(chat);
      toast.success("Chat creata!");
      router.push("/app/chat");
    } catch (err: unknown) {
      toast.error("Errore nella creazione della chat");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 max-w-lg mx-auto w-full">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn-ghost p-2 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Nuova chat</h1>
      </div>

      <div className="card p-4 flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>
            Nome della chat
          </label>
          <input
            className="input w-full"
            placeholder="Es. Pista rossa del Sestriere"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block" style={{ color: "var(--text-secondary)" }}>
            Visibilità
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setIsPublic(true)}
              className={`flex-1 card p-3 flex items-center gap-2 justify-center transition-all ${isPublic ? "ring-2 ring-indigo-500" : ""}`}
            >
              <Globe className="w-4 h-4" style={{ color: isPublic ? "var(--primary)" : "var(--text-secondary)" }} />
              <span className="text-sm font-medium" style={{ color: isPublic ? "var(--primary)" : "var(--text-secondary)" }}>
                Pubblica
              </span>
            </button>
            <button
              onClick={() => setIsPublic(false)}
              className={`flex-1 card p-3 flex items-center gap-2 justify-center transition-all ${!isPublic ? "ring-2 ring-indigo-500" : ""}`}
            >
              <Lock className="w-4 h-4" style={{ color: !isPublic ? "var(--primary)" : "var(--text-secondary)" }} />
              <span className="text-sm font-medium" style={{ color: !isPublic ? "var(--primary)" : "var(--text-secondary)" }}>
                Privata
              </span>
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block" style={{ color: "var(--text-secondary)" }}>
            Sport
          </label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(SPORT_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setSport(key)}
                className={`card p-2 text-center text-sm transition-all ${sport === key ? "ring-2 ring-indigo-500" : ""}`}
              >
                <div className="text-xl">{cfg.emoji}</div>
                <div className="text-xs mt-1" style={{ color: sport === key ? "var(--primary)" : "var(--text-secondary)" }}>
                  {cfg.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleCreate}
        disabled={loading || !name.trim()}
        className="btn-primary w-full py-3 flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        {loading ? "Creazione..." : "Crea chat"}
      </button>
    </div>
  );
}
