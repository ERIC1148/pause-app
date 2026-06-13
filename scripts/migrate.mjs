// One-off migration runner. Requires a direct Postgres connection string.
//
// Usage (PowerShell):
//   $env:DATABASE_URL = "postgresql://postgres:[PASSWORD]@db.<ref>.supabase.co:5432/postgres"
//   node scripts/migrate.mjs
//
// The connection string lives in Supabase Console → Project Settings → Database →
// Connection string (URI). It is read from the env var only — never written to the repo.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
    console.error('✗ DATABASE_URL env var is required (Supabase direct Postgres connection string).')
    process.exit(1)
}

const files = ['migrations/001_movies.sql', 'migrations/002_backfill.sql']

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } })

try {
    await client.connect()
    console.log('• Connected to database')

    for (const rel of files) {
        const sql = readFileSync(join(root, rel), 'utf8')
        console.log(`• Running ${rel} ...`)
        await client.query(sql)
        console.log(`  ✓ ${rel} done`)
    }

    const { rows: m } = await client.query('select count(*)::int as n from public.movies')
    const { rows: linked } = await client.query('select count(*)::int as n from public.scenes where movie_id is not null')
    const { rows: total } = await client.query('select count(*)::int as n from public.scenes')
    console.log(`\n✓ Migration complete`)
    console.log(`  movies created : ${m[0].n}`)
    console.log(`  scenes linked  : ${linked[0].n} / ${total[0].n}`)
} catch (err) {
    console.error('✗ Migration failed:', err.message)
    process.exitCode = 1
} finally {
    await client.end()
}
