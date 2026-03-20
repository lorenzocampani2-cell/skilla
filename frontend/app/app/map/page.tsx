"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { MapPin, Navigation, Users, Radio, RefreshCw, WifiOff } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useSocket } from "@/components/providers/SocketProvider";
import { SPORT_CONFIG } from "@shared/types";

// Leaflet richiede il DOM — import dinamico senza SSR
const LiveMap = dynamic(() => import("@/components/map/LiveMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full" style={{ background: "var(--surface-1)" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="text-4xl animate-bounce">🗺️</div>
        <p style={{ color: "var(--text-secondary)" }}>Caricamento mappa...</p>
      </div>
    </div>
  ),
});

interface AthleteLocation {
  userId: string;
  lat: number;
  lng: number;
  sport: string;
  displayName: string;
  avatar: string | null;
  accuracy: number | null;
  updatedAt: number;
}

export default function MapPage() {
  const { currentUser } = useAppStore();
  const { socket } = useSocket();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [athletes, setAthletes] = useState<AthleteLocation[]>([]);
  const [sharing, setSharing] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Ricevi posizioni dagli altri atleti
  useEffect(() => {
    if (!socket) return;

    socket.emit("location:watch");

    socket.on("location:all", (locations: AthleteLocation[]) => {
      setAthletes(locations.filter((l) => l.userId !== currentUser?.id));
    });

    socket.on("location:updated", (data: AthleteLocation) => {
      if (data.userId === currentUser?.id) return;
      setAthletes((prev) => {
        const others = prev.filter((a) => a.userId !== data.userId);
        return [...others, data];
      });
    });

    socket.on("location:removed", ({ userId }: { userId: string }) => {
      setAthletes((prev) => prev.filter((a) => a.userId !== userId));
    });

    return () => {
      socket.off("location:all");
      socket.off("location:updated");
      socket.off("location:removed");
      socket.emit("location:stop");
    };
  }, [socket, currentUser?.id]);

  // Geolocation watch
  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocalizzazione non supportata dal browser.");
      return;
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setAccuracy(pos.coords.accuracy);
        setLocationError(null);
      },
      (err) => {
        if (err.code === 1) {
          setLocationError("Permesso posizione negato. Abilita la geolocalizzazione.");
        } else {
          setLocationError("Impossibile rilevare la posizione.");
        }
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
  }, []);

  useEffect(() => {
    startWatching();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [startWatching]);

  // Toggle condivisione posizione
  const toggleSharing = useCallback(() => {
    if (!socket || !userLocation) return;
    if (sharing) {
      socket.emit("location:stop");
      setSharing(false);
    } else {
      socket.emit("location:update", {
        lat: userLocation.lat,
        lng: userLocation.lng,
        sport: currentUser?.sport || "other",
        displayName: currentUser?.displayName || currentUser?.username || "Atleta",
        avatar: currentUser?.avatar || null,
        accuracy,
      });
      setSharing(true);
    }
  }, [socket, sharing, userLocation, currentUser, accuracy]);

  // Aggiorna posizione condivisa ogni 15s
  useEffect(() => {
    if (!sharing || !socket || !userLocation) return;
    const interval = setInterval(() => {
      socket.emit("location:update", {
        lat: userLocation.lat,
        lng: userLocation.lng,
        sport: currentUser?.sport || "other",
        displayName: currentUser?.displayName || currentUser?.username || "Atleta",
        avatar: currentUser?.avatar || null,
        accuracy,
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [sharing, socket, userLocation, currentUser, accuracy]);

  const nearbyCount = athletes.length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5" style={{ color: "var(--primary)" }} />
          <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Mappa live
          </h1>
          {nearbyCount > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: "var(--primary)", color: "white" }}
            >
              {nearbyCount} vicini
            </span>
          )}
        </div>

        <button
          onClick={toggleSharing}
          disabled={!userLocation}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
            sharing
              ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
              : "btn-primary"
          } ${!userLocation ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {sharing ? (
            <>
              <WifiOff className="w-4 h-4" /> Stop
            </>
          ) : (
            <>
              <Radio className="w-4 h-4" /> Condividi
            </>
          )}
        </button>
      </div>

      {/* Info bar */}
      <div
        className="px-4 py-2 shrink-0 flex items-center gap-3 text-xs"
        style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}
      >
        {locationError ? (
          <span className="text-red-400 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {locationError}
          </span>
        ) : userLocation ? (
          <>
            <span className="flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
              <Navigation className="w-3 h-3" style={{ color: "var(--primary)" }} />
              {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              {accuracy && (
                <span className="opacity-60"> ± {Math.round(accuracy)}m</span>
              )}
            </span>
            {sharing && (
              <span className="flex items-center gap-1 text-green-400">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block" />
                Condivisione attiva
              </span>
            )}
          </>
        ) : (
          <span
            className="flex items-center gap-1 animate-pulse"
            style={{ color: "var(--text-secondary)" }}
          >
            <RefreshCw className="w-3 h-3" /> Rilevamento GPS...
          </span>
        )}
      </div>

      {/* Map container */}
      <div className="flex-1 relative overflow-hidden">
        {locationError && !userLocation ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
            <div className="text-6xl">📍</div>
            <p className="text-center font-medium" style={{ color: "var(--text-primary)" }}>
              Posizione non disponibile
            </p>
            <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
              {locationError}
            </p>
            <button onClick={startWatching} className="btn-primary px-4 py-2">
              Riprova
            </button>
          </div>
        ) : (
          <LiveMap
            userLocation={userLocation}
            athletes={athletes}
            currentUserId={currentUser?.id || ""}
            sharing={sharing}
          />
        )}

        {/* Pannello atleti vicini */}
        {nearbyCount > 0 && (
          <div
            className="absolute bottom-4 left-4 right-4 card p-3 flex flex-col gap-2 overflow-y-auto"
            style={{ maxHeight: "160px", zIndex: 1000 }}
          >
            <div
              className="flex items-center gap-2 text-xs font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              <Users className="w-3.5 h-3.5" />
              {nearbyCount} atleti online
            </div>
            <div className="flex flex-wrap gap-2">
              {athletes.map((a) => {
                const sportCfg = SPORT_CONFIG[a.sport as keyof typeof SPORT_CONFIG];
                return (
                  <div
                    key={a.userId}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <span>{sportCfg?.emoji || "🏅"}</span>
                    <span style={{ color: "var(--text-primary)" }}>{a.displayName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
