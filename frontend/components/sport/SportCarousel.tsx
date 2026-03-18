"use client";
// ============================================================
// SKILLA — Sport Carousel
// Carousel personalizzato per sport: stats, tips, sessione.
// Drag & drop ordine, visibilità pannelli configurabile.
// ============================================================

import { useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronLeft, ChevronRight, Settings2, Eye, EyeOff } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { SPORT_CONFIG } from "@shared/types";
import type { SportType } from "@shared/types";
import { cn } from "@/lib/utils";

// Contenuti per ogni tipo di card
const CARD_CONTENT = {
  stats: StatCard,
  session: SessionCard,
  tips: TipsCard,
  weather: WeatherCard,
  leaderboard: LeaderboardCard,
};

export function SportCarousel() {
  const { currentUser, updateUserPreferences, interfaceMode } = useAppStore();
  const [showConfig, setShowConfig] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  const sport = (currentUser?.sport || "skiing") as SportType;
  const sportConfig = SPORT_CONFIG[sport];
  const carouselItems = currentUser?.preferences?.carouselItems || [
    { id: "stats", type: "stats" as const, visible: true, order: 0 },
    { id: "session", type: "session" as const, visible: true, order: 1 },
    { id: "tips", type: "tips" as const, visible: true, order: 2 },
  ];

  const visibleItems = [...carouselItems]
    .filter((i) => i.visible)
    .sort((a, b) => a.order - b.order);

  const isEmergency = interfaceMode === "emergency";

  function toggleItem(id: string) {
    const updated = carouselItems.map((item) =>
      item.id === id ? { ...item, visible: !item.visible } : item
    );
    updateUserPreferences({ carouselItems: updated });
  }

  function prev() {
    setCurrentIdx((i) => Math.max(0, i - 1));
  }

  function next() {
    setCurrentIdx((i) => Math.min(visibleItems.length - 1, i + 1));
  }

  if (visibleItems.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p style={{ color: "var(--text-muted)" }} className="text-sm">
          Nessuna card attiva. Aggiungi card dalla configurazione.
        </p>
        <button onClick={() => setShowConfig(true)} className="btn-primary mt-4 mx-auto">
          Configura carousel
        </button>
      </div>
    );
  }

  const currentItem = visibleItems[currentIdx];
  const cardType = currentItem?.type as keyof typeof CARD_CONTENT;
  const CardComponent = CARD_CONTENT[cardType] || StatCard;

  return (
    <div className="flex flex-col gap-3">
      {/* Header carousel */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{sportConfig.emoji}</span>
          <h2
            className={cn(
              "font-bold",
              isEmergency ? "text-emergency-lg" : "text-lg"
            )}
            style={{ color: "var(--text-primary)" }}
          >
            Il tuo {sportConfig.label}
          </h2>
        </div>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="btn-ghost p-2 rounded-xl"
          title="Configura carousel"
        >
          <Settings2 size={16} />
        </button>
      </div>

      {/* Card principale */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem?.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <CardComponent sport={sport} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigazione dot */}
      {visibleItems.length > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={prev}
            disabled={currentIdx === 0}
            className={cn(
              "btn-ghost p-1.5 rounded-lg",
              currentIdx === 0 && "opacity-30 cursor-not-allowed"
            )}
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex gap-1.5">
            {visibleItems.map((item, i) => (
              <button
                key={item.id}
                onClick={() => setCurrentIdx(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === currentIdx ? "24px" : "8px",
                  height: "8px",
                  background: i === currentIdx ? sportConfig.color : "var(--border)",
                }}
                aria-label={`Card ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={next}
            disabled={currentIdx === visibleItems.length - 1}
            className={cn(
              "btn-ghost p-1.5 rounded-lg",
              currentIdx === visibleItems.length - 1 && "opacity-30 cursor-not-allowed"
            )}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Pannello configurazione */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="card p-4 flex flex-col gap-3"
              style={{ background: "var(--bg-secondary)" }}
            >
              <p className="text-sm font-bold" style={{ color: "var(--text-secondary)" }}>
                🎛️ Personalizza carousel
              </p>
              {carouselItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {item.type === "stats" && "📊"}
                      {item.type === "session" && "⏱️"}
                      {item.type === "tips" && "💡"}
                      {item.type === "weather" && "🌤️"}
                      {item.type === "leaderboard" && "🏆"}
                    </span>
                    <div>
                      <p className="text-sm font-medium capitalize"
                         style={{ color: "var(--text-primary)" }}>
                        {item.type === "stats" && "Statistiche"}
                        {item.type === "session" && "Sessione"}
                        {item.type === "tips" && "Consigli"}
                        {item.type === "weather" && "Meteo"}
                        {item.type === "leaderboard" && "Classifica"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="btn-ghost p-2 rounded-xl"
                  >
                    {item.visible ? (
                      <Eye size={16} className="text-blue-400" />
                    ) : (
                      <EyeOff size={16} style={{ color: "var(--text-muted)" }} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Card: Statistiche sport ──
function StatCard({ sport }: { sport: SportType }) {
  const config = SPORT_CONFIG[sport];

  // Dati mock — in produzione da API/DB
  const stats = {
    skiing: [
      { label: "Sessioni", value: "12", unit: "", icon: "🎿" },
      { label: "km totali", value: "145", unit: "km", icon: "📏" },
      { label: "Velocità max", value: "87", unit: "km/h", icon: "⚡" },
      { label: "Ore in pista", value: "38", unit: "h", icon: "⏱️" },
    ],
    football: [
      { label: "Partite", value: "24", unit: "", icon: "⚽" },
      { label: "Gol", value: "8", unit: "", icon: "🥅" },
      { label: "km percorsi", value: "192", unit: "km", icon: "📏" },
      { label: "Min giocati", value: "1840", unit: "min", icon: "⏱️" },
    ],
    running: [
      { label: "Uscite", value: "31", unit: "", icon: "🏃" },
      { label: "km totali", value: "218", unit: "km", icon: "📏" },
      { label: "Pace medio", value: "5:12", unit: "min/km", icon: "⚡" },
      { label: "Calorie", value: "12.4k", unit: "kcal", icon: "🔥" },
    ],
  };

  const data = stats[sport as keyof typeof stats] || stats.running;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{config.emoji}</span>
        <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
          Le tue statistiche
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {data.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-1 p-3 rounded-xl"
            style={{ background: "var(--bg-secondary)" }}
          >
            <span className="text-xl">{stat.icon}</span>
            <p
              className="text-2xl font-black"
              style={{ color: config.color }}
            >
              {stat.value}
              <span className="text-sm font-normal ml-1"
                    style={{ color: "var(--text-muted)" }}>
                {stat.unit}
              </span>
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Card: Sessione attiva ──
function SessionCard({ sport }: { sport: SportType }) {
  const config = SPORT_CONFIG[sport];
  const [isActive, setIsActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  function toggleSession() {
    setIsActive(!isActive);
    if (!isActive) {
      // Avvia timer
      const interval = setInterval(() => {
        setElapsed((e) => e + 1);
      }, 1000);
      // Cleanup su stop (semplificato)
    }
  }

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">⏱️</span>
        <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
          Sessione {config.label}
        </h3>
      </div>

      {/* Timer */}
      <div className="text-center py-4">
        <p
          className="text-4xl font-black font-mono"
          style={{ color: isActive ? config.color : "var(--text-muted)" }}
        >
          {formatTime(elapsed)}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          {isActive ? "Sessione in corso..." : "Pronto a iniziare?"}
        </p>
      </div>

      {/* Bottone start/stop */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={toggleSession}
        className={cn(
          "w-full py-4 rounded-2xl font-bold text-white",
          "transition-all"
        )}
        style={{
          background: isActive ? "#EF4444" : config.color,
        }}
      >
        {isActive ? "⏹️ Stop sessione" : `▶️ Inizia sessione ${config.emoji}`}
      </motion.button>
    </div>
  );
}

// ── Card: Consigli sport ──
function TipsCard({ sport }: { sport: SportType }) {
  const config = SPORT_CONFIG[sport];

  const tips: Record<string, string[]> = {
    skiing: [
      "💡 Piega le ginocchia e tieni il peso sugli sci",
      "⛷️ Guarda sempre avanti, non in basso",
      "🌡️ Oggi -8°C: usa il passamontagna",
    ],
    snowboard: [
      "🏂 Tieni le spalle parallele alla tavola",
      "⚡ Usa i frontal e backside turn alternati",
      "🧤 Con guanti spessi usa la modalità grandi icone",
    ],
    football: [
      "⚽ Prima del match: riscaldamento 15 min",
      "💪 Tieni il pallone vicino ai piedi",
      "🎯 Punta al centro della porta",
    ],
    running: [
      "🏃 Mantieni il busto dritto e le spalle rilassate",
      "👟 Atterra sul mesopiede, non sul tallone",
      "💧 Bevi 500ml ogni 30 min di corsa",
    ],
  };

  const sportTips = tips[sport] || tips.running;
  const tip = sportTips[Math.floor(Date.now() / 86400000) % sportTips.length];

  return (
    <div
      className="card p-5"
      style={{ borderLeft: `4px solid ${config.color}` }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">💡</span>
        <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
          Consiglio del giorno
        </h3>
      </div>
      <p
        className="text-sm leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        {tip}
      </p>
      <p className="text-xs mt-3" style={{ color: config.color }}>
        {config.emoji} Per {config.label}
      </p>
    </div>
  );
}

// ── Card: Meteo (placeholder) ──
function WeatherCard({ sport }: { sport: SportType }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🌤️</span>
        <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
          Meteo
        </h3>
      </div>
      <div className="text-center py-4">
        <p className="text-5xl mb-2">⛅</p>
        <p className="text-3xl font-black" style={{ color: "var(--text-primary)" }}>
          -4°C
        </p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Nuvoloso con schiarite
          <br />
          Vento: 15 km/h
        </p>
      </div>
    </div>
  );
}

// ── Card: Classifica (placeholder) ──
function LeaderboardCard({ sport }: { sport: SportType }) {
  const config = SPORT_CONFIG[sport];
  const mockLeaders = [
    { name: "Marco V.", value: "145 km", badge: "🥇" },
    { name: "Sara B.", value: "132 km", badge: "🥈" },
    { name: "Luca T.", value: "118 km", badge: "🥉" },
    { name: "Tu", value: "87 km", badge: "4°", isYou: true },
  ];

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🏆</span>
        <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
          Classifica gruppo
        </h3>
      </div>
      <div className="flex flex-col gap-2">
        {mockLeaders.map((leader, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl",
              leader.isYou && "border-2"
            )}
            style={{
              background: leader.isYou ? `${config.color}15` : "var(--bg-secondary)",
              borderColor: leader.isYou ? config.color : "transparent",
            }}
          >
            <span className="text-lg w-8 text-center">{leader.badge}</span>
            <span
              className="flex-1 text-sm font-medium"
              style={{ color: leader.isYou ? config.color : "var(--text-primary)" }}
            >
              {leader.name}
              {leader.isYou && " ⬅️"}
            </span>
            <span className="text-sm font-bold" style={{ color: "var(--text-secondary)" }}>
              {leader.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
