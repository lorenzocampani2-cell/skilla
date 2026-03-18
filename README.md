# ⛷️ SKILLA — Sport Communication Platform

> Chat, voce push-to-talk, geolocalizzazione e tracciamento sessione per atleti.
> Completamente **gratuito** e **open source**.

---

## Stack Tecnologico

| Layer | Tecnologia | Perché |
|---|---|---|
| **Frontend** | Next.js 14 + React 18 | App Router, SSR, PWA |
| **Stile** | Tailwind CSS + Framer Motion | Animazioni fluide, utility-first |
| **State** | Zustand | Leggero, persistente |
| **Backend** | Node.js + Express | Flessibile, performante |
| **Real-time** | Socket.io | Chat e voce in tempo reale |
| **Database** | Supabase (PostgreSQL) | Gratis, real-time, auth inclusa |
| **Auth** | Supabase Auth | Google, Apple, Guest anonimo |
| **QR Code** | qrcode.react | Generazione lato client |
| **Voce** | Web Speech API | Nativo browser, zero costi |
| **Deploy FE** | Vercel | Gratis, CDN globale |
| **Deploy BE** | Railway | Gratis tier, WebSocket support |

---

## Avvio rapido

### 1. Clona e installa dipendenze
```bash
git clone <repo>
cd skilla
npm run install:all
```

### 2. Configura variabili d'ambiente
```bash
# Frontend
cp frontend/.env.local.example frontend/.env.local
# Compila con le tue chiavi Supabase

# Backend
cp backend/.env.example backend/.env
# Compila con le tue chiavi Supabase (service role key)
```

### 3. Setup database
```bash
# Vai su Supabase Dashboard → SQL Editor
# Incolla ed esegui il contenuto di: supabase/schema.sql
```

### 4. Avvia in sviluppo
```bash
npm run dev
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
```

---

## Struttura Progetto

```
skilla/
├── frontend/              # Next.js app
│   ├── app/               # App Router pages
│   │   ├── page.tsx       # Landing/Login
│   │   └── app/           # Area autenticata
│   │       ├── page.tsx   # Dashboard home
│   │       ├── chat/      # Chat list + window
│   │       ├── map/       # Mappa amici
│   │       ├── profile/   # Profilo utente
│   │       └── settings/  # Impostazioni
│   ├── components/
│   │   ├── providers/     # Auth, Socket, Theme
│   │   ├── layout/        # Sidebar, BottomNav, TopBar
│   │   ├── chat/          # ChatWindow, MessageBubble, PTT, QR
│   │   ├── sport/         # SportCarousel, cards
│   │   └── ui/            # Button, Input, Modal, Toggle
│   ├── lib/
│   │   ├── store/         # Zustand global state
│   │   ├── supabase/      # Client browser + server
│   │   ├── socket/        # Socket.io singleton
│   │   └── utils.ts       # Helper functions
│   └── public/
│       └── manifest.json  # PWA manifest
│
├── backend/               # Node.js server
│   └── src/
│       ├── handlers/      # Socket.io event handlers
│       │   ├── chat.js    # Join/leave/typing
│       │   ├── messages.js # Send/delete/pin/react
│       │   └── admin.js   # Mute/expel/promote
│       ├── routes/        # REST API
│       │   ├── auth.js    # Profilo utente
│       │   ├── chats.js   # CRUD chat
│       │   └── qr.js      # QR code generation
│       ├── middleware/
│       │   └── auth.js    # JWT verification
│       └── index.js       # Entry point
│
├── shared/
│   └── types.ts           # TypeScript types condivisi
│
├── supabase/
│   └── schema.sql         # Schema DB completo
│
└── deploy/
    ├── vercel.json        # Config deploy frontend
    └── railway.json       # Config deploy backend
```

---

## Funzionalità MVP

- ✅ **Auth**: Google, Apple, Guest anonimo
- ✅ **Chat private e pubbliche** con permessi granulari
- ✅ **Admin chat**: muta, espelli, promuovi, pinna messaggi
- ✅ **QR code invito** con scadenza configurabile
- ✅ **Push-to-talk** walkie-talkie (Web Speech API)
- ✅ **Sport carousel** personalizzabile per ogni sport
- ✅ **Modalità Emergenza** (font 24px+, alto contrasto, accessibile)
- ✅ **Switch interfaccia**: Normale / Essential / Emergenza
- ✅ **Dark / Light / High Contrast** theme
- ✅ **PWA** installabile su iOS e Android
- ✅ **Badge sport** ed emoji personalizzate per account

## Funzionalità V2 (roadmap)

- [ ] Geolocalizzazione in tempo reale
- [ ] Playlist musicale condivisa
- [ ] Lobby vocale continua (WebRTC)
- [ ] Tracciamento sessione GPS
- [ ] Gamification e classifiche
- [ ] Notifiche push (FCM)

---

## Deploy

### Frontend → Vercel
```bash
vercel deploy --prod
```

### Backend → Railway
```bash
# Collega il repo Railway alla cartella /backend
# Railway rileva automaticamente Node.js
```

---

## Licenza

MIT — Gratis per sempre. Contributi benvenuti!
