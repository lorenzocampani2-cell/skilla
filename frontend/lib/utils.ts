// ============================================================
// SKILLA — Utility Functions
// ============================================================

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";
import { it } from "date-fns/locale";

// Merge classi Tailwind in modo intelligente (no conflitti)
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Formatta una data relativa (es. "5 minuti fa")
export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: it });
}

// Formatta ora (es. "14:32")
export function formatTime(date: string | Date): string {
  return format(new Date(date), "HH:mm");
}

// Formatta data completa
export function formatDate(date: string | Date): string {
  return format(new Date(date), "d MMM yyyy", { locale: it });
}

// Genera ID unico (per messaggi temporanei/ottimistici)
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Genera nome utente guest casuale
export function generateGuestName(): string {
  const adjectives = [
    "Veloce", "Forte", "Agile", "Audace", "Preciso",
    "Rapido", "Deciso", "Coraggioso", "Energico", "Potente",
  ];
  const nouns = [
    "Atleta", "Campione", "Sciatore", "Rider", "Runner",
    "Climber", "Nuotatore", "Ciclista", "Centrocampista", "Surfer",
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 999);
  return `${adj}${noun}${num}`;
}

// Genera colore avatar da stringa (deterministico)
export function stringToColor(str: string): string {
  const colors = [
    "#3B82F6", "#8B5CF6", "#10B981", "#F59E0B",
    "#EF4444", "#06B6D4", "#F97316", "#EC4899",
    "#84CC16", "#6366F1",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Iniziali da displayName
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Shortlink per invito (es. skilla.app/j/abc123)
export function buildInviteLink(chatId: string, token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  return `${base}/join/${token}`;
}

// Copia negli appunti con feedback
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback per browser vecchi
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const success = document.execCommand("copy");
    document.body.removeChild(ta);
    return success;
  }
}

// Formatta dimensione file
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Valida URL
export function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

// Debounce
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Ottieni JWT token Supabase (usato in fetch autenticate)
export async function getToken(): Promise<string> {
  try {
    const { createClientComponentClient } = await import(
      "@supabase/auth-helpers-nextjs"
    );
    const supabase = createClientComponentClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  } catch {
    return "";
  }
}

// Throttle
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastRun = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastRun >= limit) {
      lastRun = now;
      fn(...args);
    }
  };
}
