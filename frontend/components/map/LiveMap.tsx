"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

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

interface LiveMapProps {
  userLocation: { lat: number; lng: number } | null;
  athletes: AthleteLocation[];
  currentUserId: string;
  sharing: boolean;
}

const SPORT_EMOJI: Record<string, string> = {
  skiing: "⛷️", snowboard: "🏂", football: "⚽", basketball: "🏀",
  swimming: "🏊", cycling: "🚴", running: "🏃", tennis: "🎾",
  volleyball: "🏐", surf: "🏄", climbing: "🧗", gym: "💪", other: "🏅",
};

export default function LiveMap({ userLocation, athletes, currentUserId, sharing }: LiveMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, LeafletMarker>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const accuracyCircleRef = useRef<ReturnType<typeof import("leaflet")["circle"]> | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Import leaflet solo lato client
    import("leaflet").then((L) => {
      // Fix icone leaflet in Next.js
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const center: [number, number] = userLocation
        ? [userLocation.lat, userLocation.lng]
        : [45.4642, 9.1900]; // Milano default

      const map = L.map(containerRef.current!, {
        center,
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // Aggiorna posizione utente corrente
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    import("leaflet").then((L) => {
      const map = mapRef.current!;

      // Rimuovi cerchio accuratezza precedente
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.remove();
      }

      // Marker utente corrente
      const meKey = `me_${currentUserId}`;
      const existingMarker = markersRef.current.get(meKey);

      const icon = L.divIcon({
        html: `<div style="
          width:40px;height:40px;border-radius:50%;
          background:var(--primary, #6366f1);
          border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.4);
          display:flex;align-items:center;justify-content:center;
          font-size:18px;
          ${sharing ? "animation:pulse 2s infinite;" : "opacity:0.7;"}
        ">⛷️</div>
        <style>@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0.4)}50%{box-shadow:0 0 0 8px rgba(99,102,241,0)}}</style>`,
        className: "",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      if (existingMarker) {
        existingMarker.setLatLng([userLocation.lat, userLocation.lng]);
        existingMarker.setIcon(icon);
      } else {
        const marker = L.marker([userLocation.lat, userLocation.lng], { icon })
          .addTo(map)
          .bindPopup(`<b>Tu</b>${sharing ? "<br>📡 Posizione condivisa" : "<br>🔒 Non condivisa"}`);
        markersRef.current.set(meKey, marker);
      }

      map.setView([userLocation.lat, userLocation.lng], map.getZoom());
    });
  }, [userLocation, sharing, currentUserId]);

  // Aggiorna marker altri atleti
  useEffect(() => {
    if (!mapRef.current) return;

    import("leaflet").then((L) => {
      const map = mapRef.current!;
      const currentIds = new Set(athletes.map((a) => a.userId));

      // Rimuovi marker non più presenti
      markersRef.current.forEach((marker, key) => {
        if (key.startsWith("me_")) return;
        if (!currentIds.has(key)) {
          marker.remove();
          markersRef.current.delete(key);
        }
      });

      // Aggiungi/aggiorna marker atleti
      athletes.forEach((athlete) => {
        if (athlete.userId === currentUserId) return;

        const emoji = SPORT_EMOJI[athlete.sport] || "🏅";
        const icon = L.divIcon({
          html: `<div style="
            width:36px;height:36px;border-radius:50%;
            background:white;
            border:2px solid #e5e7eb;
            box-shadow:0 2px 6px rgba(0,0,0,0.3);
            display:flex;align-items:center;justify-content:center;
            font-size:16px;
          ">${emoji}</div>`,
          className: "",
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const existing = markersRef.current.get(athlete.userId);
        if (existing) {
          existing.setLatLng([athlete.lat, athlete.lng]);
          existing.setIcon(icon);
        } else {
          const timeAgo = Math.round((Date.now() - athlete.updatedAt) / 1000);
          const marker = L.marker([athlete.lat, athlete.lng], { icon })
            .addTo(map)
            .bindPopup(`
              <div style="min-width:120px">
                <b>${athlete.displayName}</b><br>
                ${emoji} ${athlete.sport}<br>
                <small style="color:#6b7280">Aggiornato ${timeAgo}s fa</small>
              </div>
            `);
          markersRef.current.set(athlete.userId, marker);
        }
      });
    });
  }, [athletes, currentUserId]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", minHeight: "400px" }}
    />
  );
}
