-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run

create extension if not exists postgis;

create table if not exists user_places (
  id          text primary key,
  name        text not null,
  type        text not null check (type in ('fuel','ev','garage','puncture')),
  lat         double precision not null,
  lon         double precision not null,
  geog        geography(Point, 4326) not null,
  fuels       text[] not null default '{}',
  fuels_known boolean not null default false,
  brand       text not null default '',
  phone       text not null default '',
  hours       text not null default '',
  veh         text[] not null default '{}',
  creator     text not null,
  created_at  timestamptz not null default now()
);

create table if not exists place_votes (
  place_id   text not null references user_places(id) on delete cascade,
  client_id  text not null,
  created_at timestamptz not null default now(),
  primary key (place_id, client_id)
);

create index if not exists user_places_geog_idx on user_places using gist (geog);

-- Supabase exposes tables through a public REST API. These tables are only used by
-- our NestJS server (direct Postgres connection), so lock the public API out completely.
alter table user_places enable row level security;
alter table place_votes enable row level security;
