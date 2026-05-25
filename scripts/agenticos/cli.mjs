#!/usr/bin/env node
// Agentic OS command center for FundedEdge.
// Usage: pnpm agenticos <status|merge-scan|check-pr|run-tests|pre-merge|roadmap|standup>
import { spawn, spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { platform } from 'node:os';
import * as checks from './lib/checks.mjs';
import * as gh from './lib/gh.mjs';
import {
  c,
  glyph,
  print,
  renderHtml,
  rule,
  sectionBar,
  spread,
  label,
  padV,
} from './lib/render.mjs';
import * as repo from './lib/repo.mjs';
import { logRun, paths, recentRuns, writeState } from './lib/state.mjs';

const argv = process.argv.slice(2);
const cmd = argv[0] || 'help';
const rest = argv.slice(1);
const flags = new Set(rest.filter((a) => a.startsWith('--')));
const positional = rest.filter((a) => !a.startsWith('--'));

// ── small helpers ───────────────────────────────────────────────────────────
const trunc = (s, n) => {
  const str = String(s ?? '');
  return str.length > n ? `${str.slice(0, n - 1)}…` : str;
};
const nowIso = () => new Date().toISOString();
const hhmmss = (iso) => String(iso).slice(11, 19);
const authorName = (a) => (a && (a.login || a.name)) || 'unknown';

function verdictBadge(ev) {
  if (ev.ready) return c.bold(c.green(`${glyph.ready} READY TO MERGE`));
  const p = ev.primary;
  if (!p) return c.gray('—');
  const extra = ev.reasons.length > 1 ? c.dim(` +${ev.reasons.length - 1}`) : '';
  if (p.level === 'fail') return c.red(`${glyph.fail} ${p.text}`) + extra;
  if (p.level === 'pending') return c.yellow(`${glyph.pending} ${p.text}`) + extra;
  if (p.level === 'review') return c.yellow(`${glyph.fail} ${p.text}`) + extra;
  return c.gray(`${p.text}`) + extra;
}

function checkGlyph(verdict) {
  if (verdict === 'pass') return c.green(glyph.ok);
  if (verdict === 'fail') return c.red(glyph.fail);
  if (verdict === 'pending') return c.yellow(glyph.pending);
  return c.gray('·');
}

function ghBanner() {
  const s = gh.status();
  if (s.ok) return null;
  return c.red(`${glyph.warn} GitHub: ${s.reason} — PR/issue/CI sections degraded`);
}

function lastTestResults() {
  const map = {};
  for (const r of recentRuns(60)) {
    if (r.action === 'run-tests' && r.suite && !map[r.suite]) {
      map[r.suite] = { result: r.result, ts: r.ts };
    }
  }
  return map;
}

function ciHealth(base) {
  const s = gh.status();
  if (!s.ok) return c.gray('gh unavailable');
  const runs = gh.runsForBranch(base, 15);
  if (!runs.length) return c.gray('no runs');
  const latest = {};
  for (const r of runs) if (!latest[r.workflowName]) latest[r.workflowName] = r;
  return Object.values(latest)
    .map((r) => {
      const concl = String(r.conclusion || '').toUpperCase();
      const running = String(r.status || '').toUpperCase() !== 'COMPLETED';
      const g = running
        ? c.yellow(glyph.pending)
        : concl === 'SUCCESS'
          ? c.green(glyph.ok)
          : c.red(glyph.fail);
      return `${trunc(r.workflowName, 10)} ${g}`;
    })
    .join('  ');
}

function openInBrowser(file) {
  const p = platform();
  const cmdName = p === 'win32' ? 'cmd' : p === 'darwin' ? 'open' : 'xdg-open';
  const args = p === 'win32' ? ['/c', 'start', '', file] : [file];
  try {
    spawn(cmdName, args, { stdio: 'ignore', detached: true }).unref();
  } catch {
    /* opening is best-effort */
  }
}

// ── data gathering ────────────────────────────────────────────────────────
function gatherPrs() {
  const s = gh.status();
  if (!s.ok) return { ok: false, prs: [], evals: [] };
  let prs = [];
  try {
    prs = gh.prList();
  } catch {
    return { ok: false, prs: [], evals: [] };
  }
  const evals = prs.map((pr) => ({ pr, ev: checks.evaluate(pr) }));
  return { ok: true, prs, evals };
}

// ── STATUS (the dashboard) ──────────────────────────────────────────────────
function buildDashboard() {
  const L = [];
  const push = (s = '') => L.push(s);
  const ts = nowIso();
  const git = repo.gitInfo();
  const phase = repo.currentPhase();
  const focus = repo.handoffFocus();
  const drift = repo.docDrift();
  const comps = repo.components();
  const { ok: prOk, evals } = gatherPrs();

  // HEADER
  push(rule('═'));
  push(spread(c.bold('FUNDEDEDGE · AGENTIC OS'), c.gray(`${glyph.refresh} ${ts}`)));
  push(rule('─'));
  const phaseLine = focus?.next
    ? `${phase.phaseTitle}   ${c.dim('▸')} next ${c.cyan(focus.next)}`
    : phase.phaseTitle;
  push(`${label('PHASE')}${phaseLine}`);
  push(`${label('BRANCH')}${c.cyan(git.branch)}  ${c.gray(`(base: ${git.base})`)}`);
  const driftNote = drift.length
    ? `   ${c.yellow(`${glyph.warn} doc drift: 02-breakdown §6 stale (${drift.join(',')})`)}`
    : '';
  push(`${label('CI')}${ciHealth(git.base)}${driftNote}`);
  const banner = ghBanner();
  if (banner) push(`${label('')}${banner}`);

  // MERGE QUEUE
  push('');
  push(sectionBar('MERGE QUEUE'));
  if (!prOk) {
    push(c.gray('  GitHub unavailable — cannot read open PRs'));
  } else if (evals.length === 0) {
    push(c.dim('  (no open PRs — queue empty)'));
  } else {
    for (const { pr, ev } of evals) {
      const head = `  ${padV(c.bold(`#${pr.number}`), 6)} ${padV(trunc(pr.title, 38), 39)} ${padV(
        c.gray(`@${trunc(authorName(pr.author), 10)}`),
        13,
      )} ${padV(c.gray(trunc(pr.headRefName, 16)), 18)}`;
      push(`${head} ${verdictBadge(ev)}`);
    }
    const ready = evals.filter((e) => e.ev.ready).length;
    push(c.dim(`  ── ${ready} ready / ${evals.length} open ──`));
  }

  // CHECKS (per-PR breakdown)
  push('');
  push(sectionBar('CHECKS'));
  if (!prOk) {
    push(c.gray('  GitHub unavailable'));
  } else if (evals.length === 0) {
    push(c.dim('  (no PRs to check)'));
  } else {
    let any = false;
    for (const { pr, ev } of evals) {
      if (!ev.checks.items.length) continue;
      any = true;
      push(`  ${c.bold(`#${pr.number}`)} ${c.gray(trunc(pr.title, 50))}`);
      for (const it of ev.checks.items) {
        const url = it.url ? c.gray(`↗ ${it.url}`) : '';
        push(`     ${checkGlyph(it.verdict)} ${trunc(it.name, 30).padEnd(30)} ${url}`);
      }
    }
    if (!any) push(c.dim('  (no CI checks reported on open PRs)'));
  }

  // TESTS
  push('');
  push(sectionBar('TESTS'));
  const suites = repo.testSuites();
  const last = lastTestResults();
  if (!suites.length) {
    push(c.gray('  no test suites found'));
  } else {
    for (const s of suites) {
      const lr = last[s.key] || last[s.kind];
      const lastStr = s.empty
        ? c.gray('(no tests)')
        : lr
          ? lr.result === 'pass'
            ? c.green(`${glyph.ok} pass`)
            : c.red(`${glyph.fail} fail`)
          : c.gray('—');
      const note = s.needsSupabase ? c.yellow(' ⚠ needs local supabase') : '';
      push(
        `  ${padV(c.bold(trunc(s.key, 14)), 14)} ${padV(c.gray(s.runner), 10)} ${padV(lastStr, 12)}${note}`,
      );
      push(`  ${' '.repeat(14)} ${c.dim(s.cmd)}`);
    }
    const cov = repo.coverageAvailable() ? c.green('configured') : c.gray('n/a');
    push(
      `  ${c.gray('ALL UNIT')} ${c.dim('pnpm test:unit')}   ${c.gray('ALL E2E')} ${c.dim(
        'pnpm test:e2e',
      )}   ${c.gray('coverage:')} ${cov}`,
    );
  }

  // ROADMAP / PHASE
  push('');
  push(sectionBar('ROADMAP / PHASE'));
  if (!comps.length) {
    push(c.gray('  registry not found in CLAUDE.md'));
  } else {
    const done = comps.filter((x) => x.status === 'done');
    const wip = comps.filter((x) => x.status === 'wip' || x.status === 'review');
    const next = comps.filter((x) => x.status === 'todo').slice(0, 3);
    if (done.length)
      push(`  ${c.green(`${glyph.done} done`)}  ${done.map((x) => `${x.id} ${x.name}`).join(' · ')}`);
    for (const w of wip)
      push(
        `  ${c.yellow(`${glyph.wip} wip `)}  ${w.id} ${w.name}${focus?.next ? c.dim(`  (${focus.next})`) : ''}`,
      );
    if (next.length)
      push(`  ${c.gray(`${glyph.next} next`)}  ${next.map((x) => `${x.id} ${x.name}`).join(' · ')}`);
  }

  // BLOCKERS
  push('');
  push(sectionBar('BLOCKERS'));
  if (!prOk) {
    push(c.gray('  GitHub unavailable — cannot read issues'));
  } else {
    let issues = [];
    try {
      issues = gh.issuesList();
    } catch {
      issues = [];
    }
    if (!issues.length) {
      push(c.green('  none open (0 issues)'));
    } else {
      const prio = (i) =>
        (i.labels || []).some((l) => /p0|critical|blocker/i.test(l.name))
          ? 0
          : (i.labels || []).some((l) => /p1|high/i.test(l.name))
            ? 1
            : 2;
      for (const i of issues.sort((a, b) => prio(a) - prio(b)).slice(0, 8)) {
        const labels = (i.labels || []).map((l) => l.name).join(',');
        const sev = prio(i) === 0 ? c.red(glyph.fail) : prio(i) === 1 ? c.yellow(glyph.warn) : c.gray('·');
        push(`  ${sev} ${c.bold(`#${i.number}`)} ${trunc(i.title, 50)} ${c.gray(labels)}`);
      }
    }
  }
  if (focus?.next) push(`  ${c.gray('phase gate:')} ${c.cyan(focus.next)} to advance Task 02`);

  // RECENT RUNS
  push('');
  push(sectionBar('RECENT RUNS'));
  const runs = recentRuns(10);
  if (!runs.length) {
    push(c.dim('  (no runs logged yet)'));
  } else {
    for (const r of runs) {
      const res =
        r.result === 'pass' || r.result === 'GO'
          ? c.green(r.result)
          : r.result === 'fail' || r.result === 'NO-GO'
            ? c.red(r.result)
            : c.gray(r.result || '');
      const detail = [r.action, r.args].filter(Boolean).join(' ');
      push(`  ${c.gray(hhmmss(r.ts))}  ${trunc(detail, 40).padEnd(40)} ${res}`);
    }
  }

  push('');
  push(rule('═'));
  push(
    c.dim(
      `  legend  ${c.green('✓/✅ green=ready')}   ${c.yellow('◷ yellow=pending')}   ${c.red(
        '✗ red=blocked/failing',
      )}`,
    ),
  );
  return { text: L.join('\n'), ts };
}

function cmdStatus() {
  const { text, ts } = buildDashboard();
  print(text);
  if (flags.has('--html')) {
    const file = join(paths.DIR, 'dashboard.html');
    try {
      writeFileSync(file, renderHtml(text, ts));
      print(c.gray(`\n  html → ${file}`));
      if (!flags.has('--no-open')) openInBrowser(file);
    } catch (e) {
      print(c.red(`  failed to write html: ${e.message}`));
    }
  }
  writeState({ phase: repo.currentPhase().phaseTitle, lastStatusAt: ts });
  logRun({ action: 'status', result: 'ok' });
}

// ── MERGE-SCAN ────────────────────────────────────────────────────────────
function cmdMergeScan() {
  const banner = ghBanner();
  if (banner) {
    print(banner);
    logRun({ action: 'merge-scan', result: 'gh-unavailable' });
    return;
  }
  const { evals } = gatherPrs();
  print(sectionBar('MERGE-SCAN'));
  if (!evals.length) {
    print(c.dim('  no open PRs — nothing to merge'));
    logRun({ action: 'merge-scan', result: '0 ready / 0 open' });
    return;
  }
  const ready = evals.filter((e) => e.ev.ready);
  const blocked = evals.filter((e) => !e.ev.ready);
  print(c.bold(c.green(`\n  READY (${ready.length}):`)));
  if (!ready.length) print(c.dim('    none'));
  for (const { pr } of ready)
    print(`    ${c.green(glyph.ready)} #${pr.number} ${trunc(pr.title, 50)} ${c.gray(pr.headRefName)}`);
  print(c.bold(`\n  NOT READY (${blocked.length}):`));
  for (const { pr, ev } of blocked)
    print(`    ${verdictBadge(ev)}  #${pr.number} ${trunc(pr.title, 44)}`);
  logRun({ action: 'merge-scan', result: `${ready.length} ready / ${evals.length} open` });
}

// ── CHECK-PR ────────────────────────────────────────────────────────────────
function cmdCheckPr(num) {
  if (!num) return print(c.red('  usage: pnpm agenticos check-pr <#>'));
  const banner = ghBanner();
  if (banner) return print(banner);
  let pr;
  try {
    pr = gh.prView(num);
  } catch {
    return print(c.red(`  could not load PR #${num} (does it exist?)`));
  }
  const ev = checks.evaluate(pr);
  print(sectionBar(`PR #${pr.number}`));
  print(`  ${c.bold(pr.title)}`);
  print(
    `  ${c.gray('by')} @${authorName(pr.author)}  ${c.gray('•')} ${c.cyan(pr.headRefName)} → ${pr.baseRefName}  ${
      pr.isDraft ? c.yellow('[draft]') : ''
    }`,
  );
  print(
    `  ${c.gray('size')} ${c.green(`+${pr.additions}`)} ${c.red(`-${pr.deletions}`)} across ${pr.changedFiles} files`,
  );
  print(
    `  ${c.gray('mergeable')} ${pr.mergeable === 'MERGEABLE' ? c.green('clean') : c.red(pr.mergeable)}   ${c.gray(
      'reviews',
    )} ${pr.reviewDecision || c.gray('none')}`,
  );

  // CI
  print(c.bold('\n  CI checks:'));
  if (!ev.checks.items.length) print(c.dim('    (none reported)'));
  for (const it of ev.checks.items)
    print(`    ${checkGlyph(it.verdict)} ${trunc(it.name, 30).padEnd(30)} ${c.gray(it.url || '')}`);

  // Reviews
  if (pr.reviews?.length) {
    print(c.bold('\n  Review activity:'));
    const byState = {};
    for (const r of pr.reviews) byState[r.state] = (byState[r.state] || 0) + 1;
    print(`    ${Object.entries(byState).map(([k, v]) => `${k}:${v}`).join('  ')}`);
  }

  // Heuristic review notes
  const files = pr.files || [];
  const notes = [];
  if (pr.additions + pr.deletions > 400 || pr.changedFiles > 20)
    notes.push('large PR — consider splitting for review');
  const sensitive = files.filter((f) =>
    /(migrations\/|rls|policies|\.github\/workflows\/|^package\.json|pnpm-lock\.yaml|packages\/db\/)/i.test(
      f.path,
    ),
  );
  if (sensitive.length)
    notes.push(`touches sensitive paths: ${sensitive.slice(0, 4).map((f) => f.path).join(', ')}`);
  const touchesSrc = files.some((f) => /\/src\//.test(f.path) && /\.[tj]sx?$/.test(f.path));
  const touchesTests = files.some((f) => /\.(test|spec)\.[tj]sx?$/.test(f.path));
  if (touchesSrc && !touchesTests) notes.push('source changed but no test files changed');
  if (pr.mergeable === 'CONFLICTING') notes.push('has merge conflicts — rebase needed');
  if (pr.isDraft) notes.push('still a draft');
  print(c.bold('\n  Quick review notes (heuristic):'));
  if (!notes.length) print(c.green('    nothing flagged'));
  for (const n of notes) print(`    ${c.yellow('•')} ${n}`);

  print(`\n  ${c.gray('verdict:')} ${ev.ready ? c.bold(c.green('READY TO MERGE')) : verdictBadge(ev)}`);
  logRun({ action: 'check-pr', args: String(num), result: ev.ready ? 'ready' : ev.primary?.text });
}

// ── RUN-TESTS ────────────────────────────────────────────────────────────────
const SUITE_CMDS = {
  unit: 'pnpm test:unit',
  e2e: 'pnpm test:e2e',
  'rules-engine': 'pnpm --filter @fundededge/rules-engine test:unit',
  db: 'pnpm --filter @fundededge/db test:unit',
  utils: 'pnpm --filter @fundededge/utils test:unit',
  web: 'pnpm --filter @fundededge/web test:e2e',
};

function cmdRunTests(suiteArg) {
  const suite = suiteArg || 'unit';
  const command = SUITE_CMDS[suite];
  if (!command) {
    print(c.red(`  unknown suite "${suite}". valid: ${Object.keys(SUITE_CMDS).join(', ')}`));
    return;
  }
  if (suite === 'db') print(c.yellow(`  ${glyph.warn} db suite needs local Supabase (supabase start → :54321)`));
  print(c.cyan(`  ▸ ${command}\n`));
  const started = Date.now();
  const res = spawnSync(command, { shell: true, stdio: 'inherit', cwd: paths.ROOT });
  const pass = res.status === 0;
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  print(pass ? c.green(`\n  ${glyph.ok} ${suite} PASS (${secs}s)`) : c.red(`\n  ${glyph.fail} ${suite} FAIL (exit ${res.status})`));
  logRun({ action: 'run-tests', suite, result: pass ? 'pass' : 'fail' });
}

// ── PRE-MERGE (gate) ──────────────────────────────────────────────────────────
function cmdPreMerge(num) {
  if (!num) return print(c.red('  usage: pnpm agenticos pre-merge <#> [--tests]'));
  const banner = ghBanner();
  if (banner) return print(banner);
  let pr;
  try {
    pr = gh.prView(num);
  } catch {
    return print(c.red(`  could not load PR #${num}`));
  }
  const ev = checks.evaluate(pr);
  print(sectionBar(`PRE-MERGE GATE · #${pr.number}`));
  print(`  ${c.bold(trunc(pr.title, 60))}\n`);
  const gate = (ok, name, detail) =>
    print(`  ${ok ? c.green(glyph.ok) : c.red(glyph.fail)} ${name.padEnd(18)} ${c.gray(detail)}`);

  gate(!pr.isDraft, 'not a draft', pr.isDraft ? 'PR is draft' : 'ok');
  gate(pr.mergeable === 'MERGEABLE', 'no conflicts', pr.mergeable === 'MERGEABLE' ? 'clean' : pr.mergeable);
  const cv = ev.checks.verdict;
  gate(cv === 'pass' || cv === 'none', 'CI checks', cv === 'fail' ? ev.checks.failed.map((f) => f.name).join(',') : cv);
  gate(pr.reviewDecision === 'APPROVED', 'approved', pr.reviewDecision || 'none');

  let testsOk = true;
  if (flags.has('--tests')) {
    print(c.cyan('\n  ▸ pnpm test:unit\n'));
    const res = spawnSync('pnpm test:unit', { shell: true, stdio: 'inherit', cwd: paths.ROOT });
    testsOk = res.status === 0;
    gate(testsOk, 'local unit tests', testsOk ? 'pass' : `exit ${res.status}`);
  }

  const go = ev.ready && testsOk;
  print(`\n  ${c.bold('VERDICT:')} ${go ? c.bold(c.green('✅ GO')) : c.bold(c.red('⛔ NO-GO'))}`);
  if (!go) {
    const reasons = ev.reasons.map((r) => r.text);
    if (!testsOk) reasons.push('local tests failed');
    print(c.gray(`  reasons: ${reasons.join('; ')}`));
  }
  logRun({ action: 'pre-merge', args: String(num), result: go ? 'GO' : 'NO-GO' });
}

// ── ROADMAP ──────────────────────────────────────────────────────────────────
function cmdRoadmap() {
  const phase = repo.currentPhase();
  const focus = repo.handoffFocus();
  const comps = repo.components();
  const drift = repo.docDrift();
  print(sectionBar('ROADMAP'));
  print(`  ${c.bold('Phase:')} ${phase.phaseTitle}`);
  if (focus?.next) print(`  ${c.bold('Next:')}  ${c.cyan(focus.next)}`);
  print('');
  for (const x of comps) {
    const g =
      x.status === 'done'
        ? c.green(`${glyph.done} done`)
        : x.status === 'wip'
          ? c.yellow(`${glyph.wip} wip `)
          : x.status === 'review'
            ? c.cyan('◐ rev ')
            : c.gray(`${glyph.next} next`);
    print(`  ${g}  ${x.id} ${x.name}`);
  }
  if (drift.length)
    print(c.yellow(`\n  ${glyph.warn} doc drift: 02-breakdown §6 lists ${drift.join(',')} as not started, but git shows them merged`));
  logRun({ action: 'roadmap', result: phase.phaseTitle });
}

// ── STANDUP ──────────────────────────────────────────────────────────────────
function cmdStandup() {
  const phase = repo.currentPhase();
  const focus = repo.handoffFocus();
  const { ok, evals } = gatherPrs();
  const last = lastTestResults();
  const failing = Object.entries(last).filter(([, v]) => v.result === 'fail').map(([k]) => k);
  print(sectionBar('STANDUP'));
  print(`  ${c.gray('Phase   ')} ${phase.phaseTitle}${focus?.next ? c.dim(`  (next: ${focus.next})`) : ''}`);
  if (ok) {
    const ready = evals.filter((e) => e.ev.ready).length;
    print(`  ${c.gray('Queue   ')} ${evals.length} open PR(s), ${ready} ready to merge`);
  } else {
    print(`  ${c.gray('Queue   ')} ${c.yellow('gh unavailable')}`);
  }
  print(
    `  ${c.gray('Tests   ')} ${
      failing.length ? c.red(`failing: ${failing.join(', ')}`) : c.green('no failures logged')
    } ${c.dim('(run-tests to refresh)')}`,
  );
  if (!ok) {
    print(`  ${c.gray('Blockers')} ${c.yellow('gh unavailable')}`);
  } else {
    let issues = [];
    try {
      issues = gh.issuesList();
    } catch {
      /* ignore */
    }
    print(`  ${c.gray('Blockers')} ${issues.length ? c.yellow(`${issues.length} open issue(s)`) : c.green('none')}`);
  }
  logRun({ action: 'standup', result: 'ok' });
}

// ── HELP ──────────────────────────────────────────────────────────────────────
function help() {
  print(sectionBar('AGENTIC OS'));
  const rows = [
    ['status [--html] [--no-open]', 'mission-control dashboard'],
    ['merge-scan', 'PRs ready to merge + reasons for the rest'],
    ['check-pr <#>', 'deep-dive one PR (CI, reviews, conflicts, notes)'],
    ['run-tests [suite]', `run tests — suite: ${Object.keys(SUITE_CMDS).join('|')}`],
    ['pre-merge <#> [--tests]', 'go/no-go gate for a PR'],
    ['roadmap', 'current phase + component registry'],
    ['standup', 'short where-things-stand brief'],
  ];
  for (const [cmdName, desc] of rows) print(`  ${c.cyan(cmdName.padEnd(30))} ${c.gray(desc)}`);
}

// ── dispatch ──────────────────────────────────────────────────────────────────
try {
  switch (cmd) {
    case 'status':
      cmdStatus();
      break;
    case 'merge-scan':
      cmdMergeScan();
      break;
    case 'check-pr':
      cmdCheckPr(positional[0]);
      break;
    case 'run-tests':
      cmdRunTests(positional[0]);
      break;
    case 'pre-merge':
      cmdPreMerge(positional[0]);
      break;
    case 'roadmap':
      cmdRoadmap();
      break;
    case 'standup':
      cmdStandup();
      break;
    default:
      help();
  }
} catch (e) {
  print(c.red(`  agenticos error: ${e.message}`));
  process.exitCode = 1;
}
