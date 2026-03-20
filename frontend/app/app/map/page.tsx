"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Users } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";

export default function MapPage() {
  const { currentUser } = useAppStore();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocalizzazione non supportata dal browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError("Permesso posizione negato. Abilita la posizione nelle impostazioni del browser.")
    );
  }, []);

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="flex items-center gap-3">
        <MapPin className="w-6 h-6" style={{ color: "var(--primary)" }} />
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Mappa</h1>
      </div>

      {error ? (
        <div className="card p-6 text-center flex flex-col gap-3 items-center">
          <Navigation className="w-12 h-12 opacity-40" />
          <p style={{ color: "var(--text-secondary)" }}>{error}</p>
        </div>
      ) : location ? (
        <div className="flex flex-col gap-4">
          <div className="card p-4 flex items-center gap-3">
            <Navigation className="w-5 h-5" style={{ color: "var(--primary)" }} />
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>La tua posizione</p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </p>
            </div>
          </div>

          <div className="card p-6 text-center flex flex-col gap-3 items-center">
            <Users className="w-10 h-10 opacity-40" />
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Mappa interattiva</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              La mappa con gli atleti vicini a te è in arrivo nella prossima versione.
            </p>
          </div>
        </div>
      ) : (
        <div className="card p-6 text-center">
          <div className="text-3xl animate-pulse mb-2">📍</div>
          <p style={{ color: "var(--text-secondary)" }}>Rilevamento posizione...</p>
        </div>
      )}
    </div>
  );
}
