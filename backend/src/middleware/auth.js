// ============================================================
// SKILLA — Auth Middleware
// Verifica JWT Supabase per ogni connessione Socket.io.
// ============================================================

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service role key solo nel backend!
);

/**
 * Middleware Socket.io — autentica ogni connessione.
 * Il frontend invia il JWT come: socket = io(url, { auth: { token } })
 */
async function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth?.token;

    // Accesso guest: nessun token, ma permettiamo comunque
    // con un userId generato (già salvato su Supabase)
    if (!token) {
      // Fallback: guest non autenticato
      socket.data.userId = `guest_${socket.id}`;
      socket.data.isGuest = true;
      return next();
    }

    // Verifica JWT con Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return next(new Error("Token non valido o scaduto"));
    }

    // Salva userId nel socket per uso negli handler
    socket.data.userId = user.id;
    socket.data.email = user.email;
    socket.data.isGuest = user.user_metadata?.is_guest === true;

    next();
  } catch (err) {
    console.error("[Auth Middleware] Errore:", err.message);
    next(new Error("Errore di autenticazione"));
  }
}

/**
 * Middleware Express — protegge le route REST.
 */
async function authenticateRequest(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token mancante" });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Token non valido" });
    }

    req.userId = user.id;
    req.user = user;
    next();
  } catch {
    res.status(500).json({ error: "Errore di autenticazione" });
  }
}

module.exports = { authenticateSocket, authenticateRequest, supabase };
