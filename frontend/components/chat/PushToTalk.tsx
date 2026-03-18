"use client";
// ============================================================
// SKILLA — Push-to-Talk
// Bottone walkie-talkie: tieni premuto → parli → rilasci.
// Usa Web Speech API (gratis, nativa del browser).
// ============================================================

import { useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useSocket } from "@/components/providers/SocketProvider";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Props {
  chatId: string;
}

export function PushToTalk({ chatId }: Props) {
  const { isRecording, setIsRecording, interfaceMode } = useAppStore();
  const { sendMessage } = useSocket();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const isEmergency = interfaceMode === "emergency";

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Converte audio in base64 e invia come messaggio
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });

        // In produzione: upload su Supabase Storage → ottieni URL → invia
        // Per ora: simula invio con indicatore vocale
        sendMessage(chatId, "🎤 [Messaggio vocale]", "audio");

        // Cleanup
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      // Feedback tattile (vibrazione su mobile)
      navigator.vibrate?.(50);

    } catch (err) {
      if ((err as Error).name === "NotAllowedError") {
        toast.error("Permesso microfono negato. Abilita il microfono nelle impostazioni.");
      } else {
        toast.error("Impossibile accedere al microfono");
      }
    }
  }, [chatId, sendMessage, setIsRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
      navigator.vibrate?.(30);
    }
  }, [isRecording, setIsRecording]);

  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      {/* Bottone PTT */}
      <motion.button
        className={cn(
          "ptt-button select-none",
          isRecording && "recording",
          isEmergency && "!w-[90px] !h-[90px]"
        )}
        onPointerDown={startRecording}
        onPointerUp={stopRecording}
        onPointerLeave={stopRecording}  // rilascia se dito esce dal bottone
        onContextMenu={(e) => e.preventDefault()} // no menu contestuale su long press
        aria-label={isRecording ? "Rilascia per smettere" : "Tieni premuto per parlare"}
        aria-pressed={isRecording}
        whileTap={{ scale: 0.92 }}
      >
        {/* Anelli pulse quando registra */}
        {isRecording && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-red-400"
              animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-red-400"
              animate={{ scale: [1, 2], opacity: [0.6, 0] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.3 }}
            />
          </>
        )}

        {/* Icona */}
        {isRecording ? (
          <Mic size={isEmergency ? 32 : 24} className="text-white" />
        ) : (
          <Mic size={isEmergency ? 32 : 24} className="text-white" />
        )}
      </motion.button>

      {/* Label */}
      <span
        className="text-[9px] font-semibold uppercase tracking-wide text-center leading-tight"
        style={{ color: isRecording ? "#EF4444" : "var(--text-muted)" }}
      >
        {isRecording ? "🔴 Parla..." : "Tieni\npremuto"}
      </span>
    </div>
  );
}
