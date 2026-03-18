// ============================================================
// SKILLA — Zustand Global Store
// Gestisce stato globale: tema, interfaccia, utente corrente,
// chat attiva. Zustand è leggero e React-friendly.
// ============================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, Chat, Message, UserPreferences, SportType } from "@/../../shared/types";

// --- Tipi tema e interfaccia ---
export type Theme = "dark" | "light" | "high-contrast";
export type InterfaceMode = "normal" | "essential" | "emergency";

// --- State shape ---
interface AppState {
  // --- Tema ---
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  // --- Modalità interfaccia ---
  interfaceMode: InterfaceMode;
  setInterfaceMode: (mode: InterfaceMode) => void;

  // --- Utente corrente ---
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  updateUserPreferences: (prefs: Partial<UserPreferences>) => void;

  // --- Chat ---
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  chats: Chat[];
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;

  // --- Messaggi (cache locale) ---
  messages: Record<string, Message[]>; // chatId → messaggi
  setMessages: (chatId: string, messages: Message[]) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void;

  // --- UI ---
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // --- Push-to-talk ---
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;

  // --- Notifiche non lette ---
  unreadCounts: Record<string, number>; // chatId → count
  setUnreadCount: (chatId: string, count: number) => void;
  clearUnread: (chatId: string) => void;
  totalUnread: () => number;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── TEMA ──
      theme: "dark",

      setTheme: (theme) => {
        set({ theme });
        // Applica classe CSS al <html> per Tailwind
        const root = document.documentElement;
        root.classList.remove("dark", "light", "high-contrast", "emergency");
        root.classList.add(theme);
      },

      toggleTheme: () => {
        const { theme, setTheme } = get();
        const next: Theme = theme === "dark" ? "light" : "dark";
        setTheme(next);
      },

      // ── INTERFACCIA ──
      interfaceMode: "normal",

      setInterfaceMode: (mode) => {
        set({ interfaceMode: mode });
        const root = document.documentElement;
        root.classList.remove("essential", "emergency");
        if (mode !== "normal") root.classList.add(mode);
      },

      // ── UTENTE ──
      currentUser: null,

      setCurrentUser: (user) => set({ currentUser: user }),

      updateUserPreferences: (prefs) => {
        const { currentUser } = get();
        if (!currentUser) return;
        set({
          currentUser: {
            ...currentUser,
            preferences: { ...currentUser.preferences, ...prefs },
          },
        });
      },

      // ── CHAT ──
      activeChatId: null,
      setActiveChatId: (id) => {
        set({ activeChatId: id });
        // Azzera unread quando apri una chat
        if (id) get().clearUnread(id);
      },

      chats: [],
      setChats: (chats) => set({ chats }),

      addChat: (chat) =>
        set((state) => ({
          chats: [chat, ...state.chats.filter((c) => c.id !== chat.id)],
        })),

      updateChat: (chatId, updates) =>
        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === chatId ? { ...c, ...updates } : c
          ),
        })),

      // ── MESSAGGI ──
      messages: {},

      setMessages: (chatId, messages) =>
        set((state) => ({
          messages: { ...state.messages, [chatId]: messages },
        })),

      addMessage: (chatId, message) =>
        set((state) => {
          const existing = state.messages[chatId] || [];
          // Evita duplicati
          if (existing.some((m) => m.id === message.id)) return state;
          return {
            messages: {
              ...state.messages,
              [chatId]: [...existing, message],
            },
          };
        }),

      updateMessage: (chatId, messageId, updates) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: (state.messages[chatId] || []).map((m) =>
              m.id === messageId ? { ...m, ...updates } : m
            ),
          },
        })),

      // ── UI ──
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      // ── PTT ──
      isRecording: false,
      setIsRecording: (recording) => set({ isRecording: recording }),

      // ── UNREAD ──
      unreadCounts: {},
      setUnreadCount: (chatId, count) =>
        set((state) => ({
          unreadCounts: { ...state.unreadCounts, [chatId]: count },
        })),
      clearUnread: (chatId) =>
        set((state) => ({
          unreadCounts: { ...state.unreadCounts, [chatId]: 0 },
        })),
      totalUnread: () =>
        Object.values(get().unreadCounts).reduce((a, b) => a + b, 0),
    }),

    {
      name: "skilla-app-store",
      storage: createJSONStorage(() => localStorage),
      // Salva solo le preferenze essenziali (non i messaggi — troppo pesanti)
      partialize: (state) => ({
        theme: state.theme,
        interfaceMode: state.interfaceMode,
        currentUser: state.currentUser,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
