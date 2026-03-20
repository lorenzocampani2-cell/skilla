"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { getToken } from "@/lib/utils";
import { Users, CheckCircle, XCircle, Loader2 } from "lucide-react";

type Status = "loading" | "valid" | "joined" | "error";

interface InviteInfo {
  chatId: string;
  chatName: string;
  sport: string;
  memberCount: number;
  createdBy: string;
}

export default function JoinChatPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;
  const { addChat } = useAppStore();

  const [status, setStatus] = useState<Status>("loading");
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!token) return;
    validateInvite();
  }, [token]);

  async function validateInvite() {
    setStatus("loading");
    try {
      const authToken = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/qr/validate/${token}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      if (!res.ok) {
        const err = await res.json();
        setErrorMsg(err.error || "Invito non valido o scaduto.");
        setStatus("error");
        return;
      }
      const data = await res.json();
      setInviteInfo(data);
      setStatus("valid");
    } catch {
      setErrorMsg("Errore di rete. Controlla la connessione.");
      setStatus("error");
    }
  }

  async function handleJoin() {
    if (!token) return;
    setJoining(true);
    try {
      const authToken = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/qr/use/${token}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      if (!res.ok) {
        const err = await res.json();
        setErrorMsg(err.error || "Impossibile unirsi alla chat.");
        setStatus("error");
        return;
      }
      const chat = await res.json();
      addChat(chat);
      setStatus("joined");
      setTimeout(() => router.push(`/app/chat/${chat.id}`), 1500);
    } catch {
      setErrorMsg("Errore durante l'accesso alla chat.");
      setStatus("error");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-6">
      <div className="card p-8 w-full max-w-sm flex flex-col items-center gap-6 text-center">

        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 animate-spin" style={{ color: "var(--primary)" }} />
            <div>
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Verifica invito...</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                Stiamo controllando il codice QR
              </p>
            </div>
          </>
        )}

        {status === "valid" && inviteInfo && (
          <>
            <div className="text-5xl">🎉</div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: "var(--text-secondary)" }}>
                Sei stato invitato in
              </p>
              <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                {inviteInfo.chatName}
              </h1>
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <Users className="w-4 h-4" />
              {inviteInfo.memberCount} {inviteInfo.memberCount === 1 ? "membro" : "membri"}
            </div>
            <button
              onClick={handleJoin}
              disabled={joining}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {joining ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Accesso...</>
              ) : (
                "Unisciti alla chat"
              )}
            </button>
            <button
              onClick={() => router.push("/app/chat")}
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Annulla
            </button>
          </>
        )}

        {status === "joined" && (
          <>
            <CheckCircle className="w-16 h-16 text-green-400" />
            <div>
              <p className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>Benvenuto!</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                Stai entrando nella chat...
              </p>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 text-red-400" />
            <div>
              <p className="font-bold" style={{ color: "var(--text-primary)" }}>Invito non valido</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{errorMsg}</p>
            </div>
            <button onClick={() => router.push("/app/chat")} className="btn-primary w-full py-3">
              Vai alle chat
            </button>
          </>
        )}
      </div>
    </div>
  );
}
