-- ============================================================
-- SKILLA — Supabase Database Schema v1.1
-- Esegui nel SQL Editor di Supabase (una sola volta).
-- ============================================================

-- Abilita estensione UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. TABELLA: profiles
--    Estende auth.users di Supabase con i dati dell'atleta.
-- ============================================================
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  username       text unique not null,
  display_name   text not null,
  avatar         text,
  sport          text not null default 'other',
  auth_type      text not null default 'email',
  badges         jsonb not null default '[]'::jsonb,
  preferences    jsonb not null default '{}'::jsonb,
  is_online      boolean not null default false,
  last_seen      timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Trigger: aggiorna updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;

create policy "profiles_select_all"
  on public.profiles for select
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);

-- ============================================================
-- 2. TABELLA: chats
--    Chat private, pubbliche e di gruppo.
-- ============================================================
create table if not exists public.chats (
  id                   text primary key,
  name                 text not null,
  type                 text not null default 'group'
                         check (type in ('public', 'private', 'group')),
  description          text,
  sport                text,
  created_by           uuid references public.profiles(id) on delete set null,
  admin_ids            text[] not null default '{}'::text[],
  pinned_message_ids   text[] not null default '{}'::text[],
  is_archived          boolean not null default false,
  settings             jsonb not null default '{
    "onlyAdminsCanWrite": false,
    "onlyAdminsCanAddMembers": false,
    "requirePin": false,
    "pin": null,
    "maxMembers": null
  }'::jsonb,
  last_message         jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger trg_chats_updated_at
  before update on public.chats
  for each row execute function public.set_updated_at();

-- Index: ricerca per tipo e sport
create index if not exists idx_chats_type     on public.chats(type);
create index if not exists idx_chats_sport    on public.chats(sport);
create index if not exists idx_chats_updated  on public.chats(updated_at desc);

-- RLS
alter table public.chats enable row level security;

-- Lettura: chat pubblica OPPURE utente è membro
create policy "chats_select"
  on public.chats for select
  using (
    type = 'public'
    or exists (
      select 1 from public.chat_members cm
      where cm.chat_id = id
        and cm.user_id = auth.uid()::text
        and cm.is_expelled = false
    )
  );

-- Inserimento: qualsiasi utente autenticato
create policy "chats_insert"
  on public.chats for insert
  with check (auth.uid() is not null);

-- Modifica: solo admin della chat
create policy "chats_update"
  on public.chats for update
  using (auth.uid()::text = any(admin_ids));

-- Eliminazione: solo il creatore
create policy "chats_delete"
  on public.chats for delete
  using (auth.uid() = created_by);

-- ============================================================
-- 3. TABELLA: chat_members
--    Associazione utente ↔ chat con ruolo e stato.
-- ============================================================
create table if not exists public.chat_members (
  id           text primary key,          -- '{chat_id}_{user_id}'
  chat_id      text not null references public.chats(id) on delete cascade,
  user_id      text not null,             -- uuid come text
  role         text not null default 'member'
                 check (role in ('admin', 'member')),
  joined_at    timestamptz not null default now(),
  is_muted     boolean not null default false,
  muted_until  timestamptz,
  is_expelled  boolean not null default false,

  unique (chat_id, user_id)
);

-- Index: lookup membro per chat
create index if not exists idx_members_chat    on public.chat_members(chat_id);
create index if not exists idx_members_user    on public.chat_members(user_id);

-- RLS
alter table public.chat_members enable row level security;

-- Lettura: puoi vedere i membri delle chat in cui sei
create policy "members_select"
  on public.chat_members for select
  using (
    user_id = auth.uid()::text
    or exists (
      select 1 from public.chat_members cm2
      where cm2.chat_id = chat_id
        and cm2.user_id = auth.uid()::text
        and cm2.is_expelled = false
    )
    or exists (
      select 1 from public.chats c
      where c.id = chat_id and c.type = 'public'
    )
  );

-- Inserimento: utente autenticato (il backend usa service role)
create policy "members_insert"
  on public.chat_members for insert
  with check (auth.uid() is not null);

-- Modifica e cancellazione: gestite dal backend via service role key
-- (il service role bypassa RLS — non servono policy extra)

-- ============================================================
-- 4. TABELLA: messages
--    Tutti i messaggi di tutte le chat.
-- ============================================================
create table if not exists public.messages (
  id           text primary key,
  chat_id      text not null references public.chats(id) on delete cascade,
  sender_id    text not null,
  type         text not null default 'text'
                 check (type in ('text', 'audio', 'image', 'system', 'qr', 'location')),
  content      text not null,
  media_url    text,
  is_pinned    boolean not null default false,
  is_deleted   boolean not null default false,
  deleted_at   timestamptz,
  reactions    jsonb not null default '[]'::jsonb,
  reply_to_id  text references public.messages(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger trg_messages_updated_at
  before update on public.messages
  for each row execute function public.set_updated_at();

-- Index: paginazione messaggi per chat
create index if not exists idx_messages_chat_time
  on public.messages(chat_id, created_at desc);

create index if not exists idx_messages_sender
  on public.messages(sender_id);

create index if not exists idx_messages_pinned
  on public.messages(chat_id, is_pinned)
  where is_pinned = true;

-- RLS
alter table public.messages enable row level security;

-- Lettura: membro della chat o chat pubblica
create policy "messages_select"
  on public.messages for select
  using (
    exists (
      select 1 from public.chat_members cm
      where cm.chat_id = messages.chat_id
        and cm.user_id = auth.uid()::text
        and cm.is_expelled = false
    )
    or exists (
      select 1 from public.chats c
      where c.id = messages.chat_id and c.type = 'public'
    )
  );

-- Inserimento: utente autenticato
create policy "messages_insert"
  on public.messages for insert
  with check (auth.uid() is not null);

-- Modifica (es. soft-delete, pin, reactions): mittente o backend
create policy "messages_update"
  on public.messages for update
  using (
    sender_id = auth.uid()::text
    or exists (
      select 1 from public.chats c
      where c.id = chat_id
        and auth.uid()::text = any(c.admin_ids)
    )
  );

-- ============================================================
-- 5. TABELLA: chat_invites
--    QR code e link d'invito con scadenza opzionale.
-- ============================================================
create table if not exists public.chat_invites (
  id           text primary key,
  chat_id      text not null references public.chats(id) on delete cascade,
  token        text unique not null,
  created_by   uuid references public.profiles(id) on delete set null,
  expires_at   timestamptz,               -- null = nessuna scadenza
  uses         integer not null default 0,
  max_uses     integer,                   -- null = illimitato
  created_at   timestamptz not null default now()
);

-- Index: lookup rapido per token (usato ad ogni scansione QR)
create index if not exists idx_invites_token
  on public.chat_invites(token);

create index if not exists idx_invites_chat
  on public.chat_invites(chat_id);

-- RLS
alter table public.chat_invites enable row level security;

-- Lettura pubblica: necessaria per validare il token prima del login
create policy "invites_select_all"
  on public.chat_invites for select
  using (true);

-- Inserimento: solo utenti autenticati (admin verificato lato backend)
create policy "invites_insert"
  on public.chat_invites for insert
  with check (auth.uid() is not null);

-- Aggiornamento contatore usi: gestito dal backend via service role
-- Eliminazione: solo chi ha creato l'invito
create policy "invites_delete"
  on public.chat_invites for delete
  using (auth.uid() = created_by);

-- ============================================================
-- 6. TABELLA: rooms
--    Stanze voce live per sport.
-- ============================================================
create table if not exists public.rooms (
  id              text primary key,
  name            text not null,
  description     text,
  creator_id      uuid references public.profiles(id) on delete set null,
  sport           text,
  is_live         boolean not null default true,
  max_users       integer,
  voice_room_id   text not null,          -- LiveKit room name
  created_at      timestamptz not null default now(),
  ended_at        timestamptz
);

create index if not exists idx_rooms_live   on public.rooms(is_live);
create index if not exists idx_rooms_sport  on public.rooms(sport);
create index if not exists idx_rooms_created on public.rooms(created_at desc);

-- RLS
alter table public.rooms enable row level security;

create policy "rooms_select_all"
  on public.rooms for select
  using (true);

create policy "rooms_insert"
  on public.rooms for insert
  with check (auth.uid() is not null);

create policy "rooms_update"
  on public.rooms for update
  using (auth.uid() = creator_id);

create policy "rooms_delete"
  on public.rooms for delete
  using (auth.uid() = creator_id);

-- ============================================================
-- 7. TABELLA: room_participants
--    Partecipanti attivi nelle stanze voce.
-- ============================================================
create table if not exists public.room_participants (
  id          text primary key,           -- '{room_id}_{user_id}'
  room_id     text not null references public.rooms(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  joined_at   timestamptz not null default now(),
  is_speaking boolean not null default false,
  is_muted    boolean not null default false,

  unique (room_id, user_id)
);

create index if not exists idx_rp_room on public.room_participants(room_id);
create index if not exists idx_rp_user on public.room_participants(user_id);

-- RLS
alter table public.room_participants enable row level security;

create policy "rp_select_all"
  on public.room_participants for select
  using (true);

create policy "rp_insert"
  on public.room_participants for insert
  with check (auth.uid() is not null);

create policy "rp_update_own"
  on public.room_participants for update
  using (auth.uid() = user_id);

create policy "rp_delete_own"
  on public.room_participants for delete
  using (auth.uid() = user_id);

-- ============================================================
-- 8. REALTIME — abilita le tabelle necessarie
-- ============================================================
-- Esegui questi comandi SOLO se vuoi il realtime Supabase
-- (opzionale: usiamo Socket.io come canale principale)
--
-- alter publication supabase_realtime add table public.messages;
-- alter publication supabase_realtime add table public.chat_members;
-- alter publication supabase_realtime add table public.chats;

-- ============================================================
-- 9. STORAGE BUCKET (da creare nella dashboard Supabase)
-- ============================================================
-- Bucket "avatars"  → pubblico, max 2 MB, solo immagini
-- Bucket "media"    → pubblico, max 10 MB, audio + immagini

-- alter publication supabase_realtime add table public.rooms;
-- alter publication supabase_realtime add table public.room_participants;

-- ============================================================
-- FINE SCHEMA
-- ============================================================
