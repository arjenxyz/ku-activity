#!/usr/bin/env node
/**
 * content/contracts/*.html → supabase/seed_contracts.sql + migrations/058_*.sql
 * Metinleri düzenlemek için HTML dosyalarını kullanın; SQL'i elle yazmayın.
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const contentDir = join(root, 'content', 'contracts');

const manifest = JSON.parse(readFileSync(join(contentDir, 'manifest.json'), 'utf8'));

function sqlEscapeSummary(s) {
  return s.replace(/'/g, "''");
}

function buildInsertBlock(contracts) {
  const rows = contracts.map((c) => {
    const html = readFileSync(join(contentDir, c.file), 'utf8').trim();
    const summary = sqlEscapeSummary(c.summary);
    const title = sqlEscapeSummary(c.title);
    return `(
  '${c.slug}',
  '${title}',
  '${summary}',
  $html$
${html}
$html$,
  ${c.version},
  ${c.is_required},
  ${c.sort_order}
)`;
  });

  return `insert into public.personnel_contracts (slug, title, summary, content_html, version, is_required, sort_order)
values
${rows.join(',\n')}
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  content_html = excluded.content_html,
  version = excluded.version,
  sort_order = excluded.sort_order,
  is_required = excluded.is_required,
  updated_at = now();`;
}

const retireSql =
  manifest.retireSlugs?.length > 0
    ? `UPDATE public.personnel_contracts
SET is_required = false, updated_at = now()
WHERE slug IN (${manifest.retireSlugs.map((s) => `'${s}'`).join(', ')});`
    : '';

const header = `-- =========================================================================================
-- CREWLEDGER PERSONEL SÖZLEŞMELERİ (otomatik üretildi)
-- Kaynak: content/contracts/*.html
-- Üret: npm run contracts:build
-- =========================================================================================
`;

const seedBody = [retireSql, buildInsertBlock(manifest.contracts)].filter(Boolean).join('\n\n');
const seedSql = header + '\n' + seedBody + '\n';

const migrationPath = join(root, 'supabase', 'migrations', '058_volunteer_platform_contracts.sql');
const seedPath = join(root, 'supabase', 'seed_contracts.sql');

writeFileSync(seedPath, seedSql, 'utf8');
writeFileSync(migrationPath, seedSql, 'utf8');

console.log('✓', seedPath);
console.log('✓', migrationPath);
console.log(`  ${manifest.contracts.length} sözleşme, ${manifest.retireSlugs?.length ?? 0} eski slug devre dışı`);
