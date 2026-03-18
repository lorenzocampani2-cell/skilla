"use client";
// ============================================================
// SKILLA — SocketProvider
// Gestisce connessione Socket.io e distribuisce eventi
// all'app tramite Zustand store.
// ============================================================

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Socket } from "socket.io-client";
import { getSocket, disconnectSocket } from "@/lib/socket/socket";
import { useAppStore } from "@/lib/store/useAppStore";
import supabase from "@/lib/supabase/client";
import type { Message, Chat, User } from "@shared/types";
import toast from "react-hot-toast";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  sendMessage: (chatId: string, content: string, type?: string) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  pinMessage: (chatId: string, messageId: string) => void;
  startTyping: (chatId: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function useSocket(): SocketContextType {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket deve essere dentro SocketProvider");
  return ctx;
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { currentUser, addMessage, updateMessage, addChat, updateChat, setUnreadCount, activeChatId } = useAppStore();

  // Inizializza socket quando l'utente è autenticato
  useEffect(() => {
    if (!currentUser) return;

    // Ottieni JWT token Supabase per autenticare il socket
    supabase.auth.getSession().then(({ data: { session } }) => {
      const token = session?.access_token;
      const sock = getSocket(token);
      socketRef.current = sock;

      // --- Gestione connessione ---
      sock.on("connect", () => {
        setIsConnected(true);
        // Informa il backend dello stato online
        sock.emit("user:status", { status: "online", userId: currentUser.id });
      });

      sock.on("disconnect", () => setIsConnected(false));

      sock.on("connect_error", (err) => {
        console.error("[Socket] Errore connessione:", err.message);
        setIsConnected(false);
      });

      // --- Messaggi in arrivo ---
      sock.on("message:new", (message: Message) => {
        addMessage(message.chatId, message);

        // Incrementa unread se non siamo in quella chat
        if (message.chatId !== activeChatId) {
          const current = useAppStore.getState().unreadCounts[message.chatId] || 0;
          setUnreadCount(message.chatId, current + 1);
        }
      });

      sock.on("message:updated", (message: Message) => {
        updateMessage(message.chatId, message.id, message);
      });

      // --- Aggiornamenti chat ---
      sock.on("chat:updated", (chat: Chat) => {
        updateChat(chat.id, chat);
      });

      // --- Nuovo membro ---
      sock.on("member:joined", ({ chatId, user }: { chatId: string; user: User }) => {
        if (user.id !== currentUser.id) {
          toast(`${user.displayName} è entrato nella chat`, {
            icon: "👋",
          });
        }
      });

      // --- Membro espulso ---
      sock.on("member:left", ({ chatId, userId }: { chatId: string; userId: string }) => {
        if (userId === currentUser.id) {
          toast.error("Sei stato rimosso dalla chat");
        }
      });

      // --- Errori ---
      sock.on("error", ({ message }: { message: string }) => {
        toast.error(message);
      });
    });

    return () => {
      disconnectSocket();
      setIsConnected(false);
    };
  }, [currentUser?.id]);

  // Aggiorna activeChatId nel ref per i listener
  const activeChatIdRef = useRef(activeChatId);
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  // --- API Socket esposta ai componenti ---
  function joinChat(chatId: string) {
    socketRef.current?.emit("chat:join", { chatId, userId: currentUser?.id });
  }

  function leaveChat(chatId: string) {
    socketRef.current?.emit("chat:leave", { chatId, userId: currentUser?.id });
  }

  function sendMessage(chatId: string, content: string, type = "text") {
    socketRef.current?.emit("message:send", { chatId, content, type });
  }

  function deleteMessage(chatId: string, messageId: string) {
    socketRef.current?.emit("message:delete", { messageId, chatId });
  }

  function pinMessage(chatId: string, messageId: string) {
    socketRef.current?.emit("message:pin", { messageId, chatId });
  }

  function startTyping(chatId: string) {
    socketRef.current?.emit("user:typing", { chatId, userId: currentUser?.id });
  }

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        joinChat,
        leaveChat,
        sendMessage,
        deleteMessage,
        pinMessage,
        startTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
