"use client";

import { useRef, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Mic } from "lucide-react";
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
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isEmergency = interfaceMode === "emergency";

  const stopRecording = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
      navigator.vibrate?.(30);
    }
  }, [isRecording, setIsRecording]);

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setDuration(0);
        if (blob.size > 600_000) { toast.error("Audio troppo lungo (max ~60s)"); return; }
        const reader = new FileReader();
        reader.onloadend = () => { sendMessage(chatId, reader.result as string, "audio"); };
        reader.readAsDataURL(blob);
      };
      mediaRecorder.start(250);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      navigator.vibrate?.(50);
      let secs = 0;
      timerRef.current = setInterval(() => { secs++; setDuration(secs); if (secs >= 60) stopRecording(); }, 1000);
    } catch (err) {
      toast.error((err as Error).name === "NotAllowedError" ? "Permesso microfono negato." : "Impossibile accedere al microfono.");
    }
  }, [chatId, sendMessage, setIsRecording, isRecording, stopRecording]);

  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      <motion.button
        className={cn("ptt-button select-none", isRecording && "recording", isEmergency && "!w-[90px] !h-[90px]")}
        onPointerDown={startRecording}
        onPointerUp={stopRecording}
        onPointerLeave={stopRecording}
        onContextMenu={(e) => e.preventDefault()}
        aria-label={isRecording ? "Rilascia per inviare" : "Tieni premuto per parlare"}
        aria-pressed={isRecording}
        whileTap={{ scale: 0.92 }}
      >
        {isRecording && (
          <>
            <motion.div className="absolute inset-0 rounded-full border-2 border-red-400" animate={{ scale: [1, 1.5], opacity: [0.8, 0] }} transition={{ repeat: Infinity, duration: 1 }} />
            <motion.div className="absolute inset-0 rounded-full border-2 border-red-400" animate={{ scale: [1, 2], opacity: [0.6, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.3 }} />
          </>
        )}
        <Mic size={isEmergency ? 32 : 24} className="text-white" />
      </motion.button>
      <span className="text-[9px] font-semibold uppercase tracking-wide text-center leading-tight" style={{ color: isRecording ? "#EF4444" : "var(--text-muted)" }}>
        {isRecording ? `🔴 ${duration}s` : "Tieni\npremuto"}
      </span>
    </div>
  );
}
