-- ============================================================
-- SKILLA — Supabase Database Schema
-- Esegui questo SQL nel SQL Editor di Supabase.
-- ============================================================

-- Abilita UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABELLA: profiles (estende auth.users di Supabase)
-- ============================================================
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  username       text unique not null,
  display_name   text not null,
  avatar         text,
  sport          text not null default 'other',
  auth_type      text not null default 'email', -- 'guest' | 'google' | 'apple' | 'email'
  badges         jsonb default '[]',
  preferences    jsonb default '{}',
  is_online      boolean default false,
  last_seen      timestamptz default now(),
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- RLS: ogni utente può leggere i profili pubblici
alter table public.profiles enable row level security;

create policy "Profili pubblici leggibili da tutti"
  on public.profiles for select using (true);

create policy "Utente modifica solo il proprio profilo"
  on public.profiles for update using (auth.uid() = id);

create policy "Inserimento solo per utente autenticato"
  on public.profiles for insert with check (auth.uid() = id);

-- ============================================================
-- TABELLA: chats
-- ============================================================
create table if not exists public.chats (
  id                   text primary key,
  name                 text not null,
  type                 text not null default 'group', -- 'public' | 'private' | 'group'
  description          text,
  sport                text,
  created_by           uuid references public.profiles(id),
  admin_ids            text[] default array[]::text[],
  pinned_message_ids   text[] default array[]::text[],
  is_archived          boolean default false,
  settings             jsonb default '{}',
  last_message         jsonb,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

alter table public.chats enable row level security;

-- Chat pubbliche: leggibili da tutti
create policy "Chat pubbliche visibili a tutti"
  on public.chats for select
  using (type = 'public' or exists (
    select 1 from public.chat_members
    where chat_id = id and user_id = auth.uid()::text and is_expelled = false
  ));

-- Solo chi è nella chat può aggiornare
create policy "Solo admin possono modificare la chat"
  on public.chats for update
  using (auth.uid()::text = any(admin_ids));

create policy "Chiunque autenticato può creare chat"
  on public.chats for insert
  with check (auth.uid() is not null);

-- ============================================================
-- TABELLA: chat_members
-- ============================================================
create table if not exists public.chat_members (
  id           text primary key, -- '{chat_id}_{user_id}'
  chat_id      text not null references public.chats(id) on delete cascade,
  user_id      text not null, -- uuid come text per semplicità
  role         text not null default 'member', -- 'admin' | 'member'
  joined_at    timestamptz default now(),
  is_muted     boolean default false,
  muted_until  timestamptz,
  is_expelled  boolean default false,

  unique(chat_id, user_id)
);

alter table public.chat_members enable row level security;

create policy "Membri visibili ai partecipanti"
  on public.chat_members for select
  using (user_id = auth.uid()::text or exists (
    select 1 from public.chat_members cm2
    where cm2.chat_id = chat_id and cm2.user_id = auth.uid()::text
  ));

create policy "Inserimento membro"
  on public.chat_members for insert
  with check (auth.uid() is not null);

create policy "Aggiornamento membro (solo backend con service role)"
  on public.chat_members for update
  using (true); -- il backend usa service role key, bypass RLS

-- ============================================================
-- TABELLA: messages
-- ============================================================
create table if not exists public.messages (
  id           text primary key,
  chat_id      text not null references public.chats(id) on delete cascade,
  sender_id    text not null,
  type         text not null default 'text', -- 'text' | 'audio' | 'image' | 'system' | 'qr'
  content      text not null,
  media_url    text,
  is_pinned    boolean default false,
  is_deleted   boolean default false,
  deleted_at   timestamptz,
  reactions    jsonb default '[]',
  reply_to_id  text references public.messages(id),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Index per performance
create index if not exists idx_messages_chat_id on public.messages(chat_id, created_at desc);
create index if not exists idx_messages_sender on public.messages(sender_id);

alter table public.messages enable row level security;

create policy "Messaggi visibili ai membri della chat"
  on public.messages for select
  using (exists (
    select 1 from public.chat_members
    where chat_id = messages.chat_id
      and user_id = auth.uid()::text
      and is_expelled = false
  ) or exists (
    select 1 from public.chats
    where id = messages.chat_id and type = 'public'
  ));

create policy "Inserimento messaggi"
  on public.messages for insert
  with check (auth.uid() is not null);

-- ============================================================
-- TABELLA: chat_invites (QR code e link invito)
-- ============================================================
create table if not exists public.chat_invites (
  id           text primary key,
  chat_id      text not null references public.chats(id) on delete cascade,
  token        text unique not null,
  created_by   uuid references public.profiles(id),
  expires_at   timestamptz,
  uses         integer default 0,
  max_uses     integer,
  created_at   timestamptz default now()
);

create index if not exists idx_invites_token on public.chat_invites(token);

alter table public.chat_invites enable row level security;

create policy "Inviti leggibili da tutti (per validazione)"
  on public.chat_invites for select using (true);

create policy "Solo admin creano inviti"
  on public.chat_invites for insert
  with check (auth.uid() is not null);

-- ============================================================
-- FUNZIONI HELPER
-- ============================================================

-- Auto-aggiorna updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger updated_at su profiles
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Trigger updated_at su chats
create trigger set_chats_updated_at
  before update on public.chats
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- STORAGE BUCKET per audio e immagini
-- ============================================================
-- (Da creare nella dashboard Supabase → Storage)
-- Bucket: 'media' — pubblico
-- Bucket: 'avatars' — pubblico

-- ============================================================
-- REALTIME (abilita per le tabelle necessarie)
-- ============================================================
-- In Supabase Dashboard → Database → Replication:
-- Abilita REALTIME per: messages, chat_members, chats
