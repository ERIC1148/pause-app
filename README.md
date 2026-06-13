# Pause

> *Pause the moment, save the echo.*

A cinematic scene-card app for logging movie quotes and watch memories. Type a line of dialogue, pick a color grade, and export a film-style card — all stored in your personal archive.

![Vue 3](https://img.shields.io/badge/Vue%203-35495e?style=flat&logo=vue.js&logoColor=4FC08D) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white) ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)

## Features

- **Studio** — Compose scene cards with dialogue, character, movie metadata, and cinema ticket info (date, seat, venue)
- **Color Grades** — 10 cinematic presets applied to the card background in real time
- **Dialogue Mode** — Multi-line input is auto-detected as a conversation and rendered with alternating speaker styles
- **Export** — Renders cards to PNG via html2canvas and saves them to your Supabase storage
- **Gallery** — Browse all your saved scene cards; tap any to re-open it in Studio for editing
- **Watch Records** — Link scenes to a movie and track where and when you saw it
- **Auth** — Email/password sign-up and Google OAuth, powered by Supabase Auth

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Vue 3 (Composition API, SFCs) |
| Build | Vite |
| Styling | Tailwind CSS v3 |
| Backend / Auth / DB | Supabase (PostgreSQL + Auth) |
| Image Export | html2canvas |

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier is sufficient)

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/ERIC1148/pause-app.git
cd pause-app
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Find both values in your Supabase Console → **Project Settings → API**.

### 3. Set up the database

In your Supabase project, go to **SQL Editor** and run:

```sql
-- Scene cards
create table watch_records (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  thumbnail   text,
  metadata    jsonb default '{}',
  created_at  bigint
);

-- Movies (watch log)
create table movies (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users not null,
  title        text not null,
  year         text,
  cinema       text,
  watched_date date,
  seat         text,
  created_at   timestamptz default now()
);

-- Row Level Security: users access only their own data
alter table watch_records enable row level security;
alter table movies         enable row level security;

create policy "own records" on watch_records for all using (auth.uid() = user_id);
create policy "own movies"  on movies         for all using (auth.uid() = user_id);
```

Enable **Google OAuth** (optional) in Supabase Console → **Authentication → Providers → Google**.

### 4. Install and run

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5174`.

## Deployment

### Vercel / Netlify

1. Push your fork to GitHub.
2. Import the repo in Vercel or Netlify.
3. Add the two environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the platform's dashboard.
4. Deploy — no extra build configuration needed beyond Vite defaults.

### Self-hosted

```bash
npm run build   # outputs to dist/
```

Serve the `dist/` directory with any static file server (nginx, Caddy, etc.).

## Project Structure

```
src/
├── lib/
│   └── supabase.js            Supabase client (reads from env vars)
├── composables/
│   ├── useAuth.js             Auth state, login/signup, Google OAuth, account settings
│   └── useScenes.js           Scene CRUD, Studio state, html2canvas export, color grades
├── views/
│   ├── HomeView.vue           Showcase card, shuffle, gallery entry point
│   └── StudioView.vue         Scene card editor with live preview
└── components/
    ├── GalleryOverlay.vue     Full-screen card grid
    ├── MovieDetailOverlay.vue Movie detail & watch log
    ├── SettingsOverlay.vue    Account settings (profile + security)
    ├── WatchTimeline.vue      Watch history timeline
    ├── LoginPage.vue          Auth screens
    └── ToastMessage.vue       Notification banner
```

## License

MIT
