-- 观影记录表
create table if not exists public.movies (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  year         text,
  cinema       text,
  watched_date date,
  seat         text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table public.movies enable row level security;

drop policy if exists "movies_owner_all" on public.movies;
create policy "movies_owner_all" on public.movies
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists movies_user_idx on public.movies(user_id);

-- 台词关联到观影记录（删除电影时台词保留、仅解除关联）
alter table public.scenes
  add column if not exists movie_id uuid references public.movies(id) on delete set null;

create index if not exists scenes_movie_idx on public.scenes(movie_id);
