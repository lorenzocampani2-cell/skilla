// ============================================================
// SKILLA — Location Handler (Socket.io)
// Gestisce la condivisione posizione real-time tra atleti.
// ============================================================

// locationData: { userId, lat, lng, sport, displayName, avatar, accuracy }
const activeLocations = new Map(); // userId → locationData

function registerLocationHandlers(io, socket, userSockets) {
  const userId = socket.data.userId;

  // Utente condivide la sua posizione
  socket.on("location:update", (data) => {
    const { lat, lng, sport, displayName, avatar, accuracy } = data;
    if (typeof lat !== "number" || typeof lng !== "number") return;

    const locationData = {
      userId,
      lat,
      lng,
      sport: sport || "other",
      displayName: displayName || "Atleta",
      avatar: avatar || null,
      accuracy: accuracy || null,
      updatedAt: Date.now(),
    };

    activeLocations.set(userId, locationData);
    socket.join("map:room");

    // Broadcast a tutti nella stanza mappa
    io.to("map:room").emit("location:updated", locationData);

    // Manda al nuovo arrivato tutte le posizioni esistenti
    socket.emit("location:all", Array.from(activeLocations.values()));
  });

  // Utente vuole vedere le posizioni correnti (senza condividere la sua)
  socket.on("location:watch", () => {
    socket.join("map:room");
    socket.emit("location:all", Array.from(activeLocations.values()));
  });

  // Utente smette di condividere
  socket.on("location:stop", () => {
    activeLocations.delete(userId);
    socket.leave("map:room");
    io.to("map:room").emit("location:removed", { userId });
  });

  // Pulizia alla disconnessione
  socket.on("disconnect", () => {
    if (activeLocations.has(userId)) {
      activeLocations.delete(userId);
      io.to("map:room").emit("location:removed", { userId });
    }
  });
}

module.exports = { registerLocationHandlers };
