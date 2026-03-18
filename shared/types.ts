// ============================================================
// SKILLA — Shared Types
// Usati sia dal frontend che dal backend per coerenza totale
// ============================================================

// --- SPORT ---
export type SportType =
  | "skiing"
  | "snowboard"
  | "football"
  | "basketball"
  | "swimming"
  | "cycling"
  | "running"
  | "tennis"
  | "volleyball"
  | "surf"
  | "climbing"
  | "gym"
  | "other";

export const SPORT_CONFIG: Record<
  SportType,
  { label: string; emoji: string; color: string; badge: string }
> = {
  skiing: { label: "Sci", emoji: "⛷️", color: "#3B82F6", badge: "🏔️" },
  snowboard: {
    label: "Snowboard",
    emoji: "🏂",
    color: "#8B5CF6",
    badge: "🌨️",
  },
  football: { label: "Calcio", emoji: "⚽", color: "#10B981", badge: "🥅" },
  basketball: {
    label: "Basket",
    emoji: "🏀",
    color: "#F59E0B",
    badge: "🏟️",
  },
  swimming: { label: "Nuoto", emoji: "🏊", color: "#06B6D4", badge: "🌊" },
  cycling: { label: "Ciclismo", emoji: "🚴", color: "#EF4444", badge: "🏁" },
  running: { label: "Running", emoji: "🏃", color: "#F97316", badge: "👟" },
  tennis: { label: "Tennis", emoji: "🎾", color: "#84CC16", badge: "🏆" },
  volleyball: {
    label: "Volley",
    emoji: "🏐",
    color: "#EC4899",
    badge: "🌟",
  },
  surf: { label: "Surf", emoji: "🏄", color: "#0EA5E9", badge: "🌊" },
  climbing: {
    label: "Arrampicata",
    emoji: "🧗",
    color: "#78716C",
    badge: "⛰️",
  },
  gym: { label: "Palestra", emoji: "🏋️", color: "#6366F1", badge: "💪" },
  other: { label: "Altro", emoji: "🎽", color: "#6B7280", badge: "🌟" },
};

// --- UTENTE ---
export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  sport: SportType;
  authType: "guest" | "google" | "apple" | "email";
  badges: Badge[];
  preferences: UserPreferences;
  createdAt: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface Badge {
  id: string;
  label: string;
  emoji: string;
  type: "admin" | "pro" | "veteran" | "sport" | "custom";
  color: string;
}

export interface UserPreferences {
  language: "it" | "en";
  theme: "dark" | "light" | "high-contrast";
  interfaceMode: "normal" | "essential" | "emergency";
  notifications: NotificationSettings;
  layout: PanelLayout[];
  sport: SportType;
  carouselItems: CarouselItemConfig[];
}

export interface NotificationSettings {
  push: boolean;
  newMessages: boolean;
  newMembers: boolean;
  mentions: boolean;
  sound: boolean;
}

// --- LAYOUT & PANNELLI ---
export interface PanelLayout {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  visible: boolean;
}

// --- CAROUSEL ---
export interface CarouselItemConfig {
  id: string;
  type: "stats" | "news" | "tips" | "weather" | "leaderboard" | "session";
  visible: boolean;
  order: number;
}

// --- CHAT ---
export type ChatType = "public" | "private" | "group";

export interface Chat {
  id: string;
  name: string;
  type: ChatType;
  description?: string;
  sport?: SportType;
  members: ChatMember[];
  adminIds: string[];
  createdBy: string;
  createdAt: string;
  lastMessage?: Message;
  pinnedMessageIds: string[];
  qrCode?: string;
  inviteLink?: string;
  inviteExpiry?: string; // ISO date — null = no expiry
  isArchived: boolean;
  settings: ChatSettings;
}

export interface ChatSettings {
  onlyAdminsCanWrite: boolean;
  onlyAdminsCanAddMembers: boolean;
  requirePin: boolean;
  pin?: string; // hashed
  maxMembers?: number;
}

export interface ChatMember {
  userId: string;
  user: User;
  role: "admin" | "member";
  joinedAt: string;
  isMuted: boolean;
  mutedUntil?: string;
  isExpelled: boolean;
}

// --- MESSAGGI ---
export type MessageType =
  | "text"
  | "image"
  | "audio"
  | "system"
  | "qr"
  | "location";

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  sender?: User;
  type: MessageType;
  content: string;
  mediaUrl?: string;
  isPinned: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  reactions: MessageReaction[];
  replyToId?: string;
  replyTo?: Message;
  createdAt: string;
  updatedAt?: string;
}

export interface MessageReaction {
  emoji: string;
  userIds: string[];
}

// --- SOCKET EVENTS ---
export interface SocketEvents {
  // client → server
  "chat:join": { chatId: string; userId: string };
  "chat:leave": { chatId: string; userId: string };
  "message:send": {
    chatId: string;
    content: string;
    type: MessageType;
    replyToId?: string;
  };
  "message:delete": { messageId: string; chatId: string };
  "message:pin": { messageId: string; chatId: string };
  "member:mute": { userId: string; chatId: string; duration?: number };
  "member:expel": { userId: string; chatId: string };
  "member:promote": { userId: string; chatId: string };
  "user:typing": { chatId: string; userId: string };
  "user:status": { status: "online" | "offline" | "away" };

  // server → client
  "message:new": Message;
  "message:updated": Message;
  "member:joined": { chatId: string; user: User };
  "member:left": { chatId: string; userId: string };
  "user:typing:broadcast": { chatId: string; userId: string; username: string };
  "chat:updated": Chat;
  error: { message: string; code: string };
}

// --- API RESPONSES ---
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
