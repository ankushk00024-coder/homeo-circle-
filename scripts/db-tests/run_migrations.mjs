// Applies Supabase stubs + every migration in supabase/migrations to an
// in-memory Postgres 17 (PGlite), each file as one transaction like the SQL
// editor / CLI. Exits non-zero on the first failing migration.
import { PGlite } from '@electric-sql/pglite';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import fs from 'node:fs';
import path from 'node:path';

const dir = process.env.MIGRATIONS_DIR || process.argv[2] || new URL('../../supabase/migrations/', import.meta.url).pathname;
const db = new PGlite({ extensions: { uuid_ossp } });
await db.exec(fs.readFileSync(new URL('./supabase_stubs.sql', import.meta.url), 'utf8'));
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
let ok = true;
for (const f of files) {
  const sql = fs.readFileSync(path.join(dir, f), 'utf8');
  try {
    await db.exec(sql);
    console.log(`OK    ${f}`);
  } catch (e) {
    ok = false;
    let where = '';
    if (e.position) {
      const pos = Number(e.position);
      const line = sql.slice(0, pos).split('\n').length;
      where = ` (line ${line}: ${sql.split('\n')[line - 1].trim().slice(0, 110)})`;
    }
    console.log(`FAIL  ${f}: ${e.message}${where}`);
    if (e.where) console.log(`      context: ${e.where.split('\n')[0]}`);
    break;
  }
}
globalThis.__db = db;
if (!ok) process.exitCode = 1;
export { db, ok };
