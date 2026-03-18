"use client";
// ============================================================
// SKILLA — Landing / Login Page
// Prima schermata: accedi con Google, Apple o come ospite.
// ============================================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { SPORT_CONFIG, SportType } from "@/../../shared/types";
import { generateGuestName } from "@/lib/utils";

// Elenco sport per la selezione iniziale
const SPORTS = Object.entries(SPORT_CONFIG) as [SportType, (typeof SPORT_CONFIG)[SportType]][];

export default function LandingPage() {
  const { signInWithGoogle, signInWithApple, signInAsGuest, isLoading } = useAuth();
  const [step, setStep] = useState<"home" | "guest-setup">("home");
  const [guestName, setGuestName] = useState(generateGuestName());
  const [selectedSport, setSelectedSport] = useState<SportType>("skiing");

  function handleGuestContinue() {
    signInAsGuest(guestName || generateGuestName());
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center
                     px-4 hero-gradient overflow-hidden">

      {/* Sfondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full
                        bg-blue-500/10 blur-3xl animate-float" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full
                        bg-violet-500/10 blur-3xl animate-float"
             style={{ animationDelay: "1.5s" }} />
      </div>

      <AnimatePresence mode="wait">
        {step === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-sm flex flex-col items-center gap-8"
          >
            {/* Logo */}
            <div className="flex flex-col items-center gap-3">
              <motion.div
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="text-7xl"
              >
                ⛷️
              </motion.div>
              <h1 className="text-5xl font-black text-gradient tracking-tight">
                SKILLA
              </h1>
              <p className="text-center text-sm font-medium"
                 style={{ color: "var(--text-secondary)" }}>
                La piattaforma sport-first per atleti.
                <br />
                Chat, voce, tracking. Gratis.
              </p>
            </div>

            {/* Bottoni login */}
            <div className="w-full flex flex-col gap-3">
              {/* Google */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={signInWithGoogle}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3
                           py-4 rounded-2xl font-semibold text-sm
                           bg-white text-gray-800 shadow-md
                           hover:shadow-lg transition-all touch-target-lg"
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continua con Google
              </motion.button>

              {/* Apple */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={signInWithApple}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3
                           py-4 rounded-2xl font-semibold text-sm
                           bg-black text-white shadow-md
                           hover:bg-gray-900 transition-all touch-target-lg"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.44c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.56-1.32 3.1-2.54 3.95zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Continua con Apple
              </motion.button>

              {/* Separatore */}
              <div className="divider text-xs">oppure</div>

              {/* Guest */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep("guest-setup")}
                className="w-full py-4 rounded-2xl font-semibold text-sm
                           border-2 transition-all touch-target-lg"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                  background: "var(--bg-secondary)",
                }}
              >
                👤 Entra come ospite
              </motion.button>
            </div>

            {/* Note privacy */}
            <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
              Nessun costo, nessuna carta di credito.
              <br />
              Accesso ospite: nessun dato richiesto.
            </p>
          </motion.div>
        )}

        {/* Step 2: configurazione ospite */}
        {step === "guest-setup" && (
          <motion.div
            key="guest"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm flex flex-col gap-6"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep("home")}
                className="btn-ghost p-2 rounded-xl"
              >
                ←
              </button>
              <h2 className="text-2xl font-bold">Il tuo profilo</h2>
            </div>

            {/* Nome */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold"
                     style={{ color: "var(--text-secondary)" }}>
                Come vuoi chiamarti?
              </label>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Il tuo nome..."
                  maxLength={30}
                />
                <button
                  onClick={() => setGuestName(generateGuestName())}
                  className="btn-ghost px-3 rounded-xl text-lg"
                  title="Nome casuale"
                >
                  🎲
                </button>
              </div>
            </div>

            {/* Selezione sport */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold"
                     style={{ color: "var(--text-secondary)" }}>
                Il tuo sport
              </label>
              <div className="grid grid-cols-4 gap-2">
                {SPORTS.map(([key, sport]) => (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedSport(key)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl
                               border-2 transition-all"
                    style={{
                      borderColor: selectedSport === key ? sport.color : "var(--border)",
                      background: selectedSport === key
                        ? `${sport.color}20`
                        : "var(--bg-secondary)",
                    }}
                  >
                    <span className="text-2xl">{sport.emoji}</span>
                    <span className="text-xs font-medium leading-tight text-center"
                          style={{ color: "var(--text-secondary)" }}>
                      {sport.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* CTA */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleGuestContinue}
              disabled={isLoading || !guestName.trim()}
              className="btn-primary w-full py-4 text-base rounded-2xl"
            >
              {isLoading ? "Caricamento..." : `Entra come ${guestName} ${SPORT_CONFIG[selectedSport].emoji}`}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

// Helper locale
function generateGuestName(): string {
  const adj = ["Veloce", "Forte", "Agile", "Audace", "Rapido"];
  const noun = ["Atleta", "Rider", "Runner", "Climber", "Sciatore"];
  return `${adj[Math.floor(Math.random() * adj.length)]}${noun[Math.floor(Math.random() * noun.length)]}${Math.floor(Math.random() * 99)}`;
}
