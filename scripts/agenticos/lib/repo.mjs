// Local repo signals derived from files + git — no network required.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { paths } from './state.mjs';

const ROOT = paths.ROOT;

function read(rel) {
  const p = join(ROOT, rel);
  return existsSync(p) ? readFileSync(p, 'utf8') : '';
}

function git(args, fallback = '') {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return fallback;
  }
}

export function gitInfo() {
  return {
    branch: git(['rev-parse', '--abbrev-ref', 'HEAD'], 'unknown'),
    base: 'main',
    commits: git(['log', '--oneline', '-10'], '')
      .split('\n')
      .filter(Boolean),
  };
}

const STATUS = {
  done: { key: 'done', glyph: '🟢' },
  wip: { key: 'wip', glyph: '🟡' },
  review: { key: 'review', glyph: '🔵' },
  todo: { key: 'todo', glyph: '🔴' },
};

function classify(emoji) {
  if (emoji.includes('🟢')) return 'done';
  if (emoji.includes('🟡')) return 'wip';
  if (emoji.includes('🔵')) return 'review';
  return 'todo';
}

// Parse the component registry table in CLAUDE.md.
export function components() {
  const md = read('CLAUDE.md');
  const rows = [];
  const re = /^\|\s*(\d{2})\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/gm;
  let m;
  // biome-ignore lint/suspicious/noAssignInExpressions: regex exec loop.
  while ((m = re.exec(md))) {
    const [, id, name, , statusCell] = m;
    if (!/[🟢🟡🔵🔴]/.test(statusCell)) continue;
    rows.push({ id, name: name.trim(), status: classify(statusCell) });
  }
  return rows;
}

export function currentPhase() {
  const claude = read('CLAUDE.md');
  const m = claude.match(/\*\*Current phase:\*\*\s*([^\n]+)/);
  const phaseName = m ? m[1].replace(/\s*—.*$/, '').trim() : 'Unknown';
  // Map to a roadmap heading if possible.
  const roadmap = read('docs/roadmap.md');
  const heading = roadmap
    .split('\n')
    .find((l) => /^##\s*Phase\s/i.test(l) && l.toLowerCase().includes(phaseName.toLowerCase()));
  const phaseTitle = heading ? heading.replace(/^##\s*/, '').trim() : `Phase: ${phaseName}`;
  return { phaseName, phaseTitle };
}

// Pull the "next up" focus + session table state from handoff.md.
export function handoffFocus() {
  const md = read('handoff.md');
  if (!md) return null;
  const nextLine = md
    .split('\n')
    .find((l) => /next up/i.test(l) && /S\d+/.test(l));
  const next = nextLine ? (nextLine.match(/S\d+\s*[—–-]\s*[^|]+/) || [])[0] : null;
  return { next: next ? next.trim() : null };
}

// Detect drift: sessions marked "Not started" in 02-breakdown §6 that git history
// shows as already merged (commit subject mentions the session + a PR number).
export function docDrift() {
  const md = read('docs/tasks/02-breakdown.md');
  const log = git(['log', '--oneline', '-40'], '');
  if (!md || !log) return [];
  // Only count a session as actually merged when its commit also lands a PR
  // (`(#NN)`); this excludes sync/handoff commits that merely mention "S11-next".
  const merged = new Set();
  for (const line of log.split('\n')) {
    if (!/\(#\d+\)/.test(line)) continue;
    for (const sm of line.matchAll(/\bS(\d+)\b/g)) merged.add(`S${sm[1]}`);
  }
  const drift = [];
  const re = /^\|\s*(S\d+)\s*\|[^|]*\|\s*([^|]*?)\s*\|/gm;
  let m;
  // biome-ignore lint/suspicious/noAssignInExpressions: regex exec loop.
  while ((m = re.exec(md))) {
    const [, sid, statusCell] = m;
    if (/not started/i.test(statusCell) && merged.has(sid)) drift.push(sid);
  }
  return drift;
}

function listPackages() {
  const out = [];
  for (const group of ['apps', 'packages']) {
    const base = join(ROOT, group);
    if (!existsSync(base)) continue;
    for (const name of readdirSync(base)) {
      const pkgPath = join(base, name, 'package.json');
      if (!existsSync(pkgPath)) continue;
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
        out.push({ dir: join(group, name), pkg });
      } catch {
        /* skip unreadable package */
      }
    }
  }
  return out;
}

function hasTestFiles(dir) {
  const root = join(ROOT, dir, 'src');
  const e2e = join(ROOT, dir, 'e2e');
  const found = [];
  const walk = (d) => {
    if (!existsSync(d)) return;
    for (const entry of readdirSync(d)) {
      const full = join(d, entry);
      if (entry === 'node_modules') continue;
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(test|spec)\.[tj]sx?$/.test(entry)) found.push(full);
    }
  };
  walk(root);
  walk(e2e);
  return found.length;
}

// Discover real test suites + the exact command to run each.
export function testSuites() {
  const suites = [];
  for (const { dir, pkg } of listPackages()) {
    const short = (pkg.name || dir).replace('@fundededge/', '');
    const filter = pkg.name || dir;
    if (pkg.scripts?.['test:unit']) {
      const passthrough = /passWithNoTests/.test(pkg.scripts['test:unit']);
      const count = hasTestFiles(dir);
      suites.push({
        key: short,
        kind: 'unit',
        runner: 'vitest',
        count,
        empty: count === 0,
        passthrough,
        needsSupabase: pkg.name === '@fundededge/db',
        cmd: `pnpm --filter ${filter} test:unit`,
      });
    }
    if (pkg.scripts?.['test:e2e']) {
      suites.push({
        key: short,
        kind: 'e2e',
        runner: 'playwright',
        count: hasTestFiles(dir),
        cmd: `pnpm --filter ${filter} test:e2e`,
      });
    }
  }
  return suites;
}

export function coverageAvailable() {
  for (const { pkg } of listPackages()) {
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    if (deps['@vitest/coverage-v8'] || deps['@vitest/coverage-istanbul']) return true;
  }
  return false;
}

export { STATUS };
