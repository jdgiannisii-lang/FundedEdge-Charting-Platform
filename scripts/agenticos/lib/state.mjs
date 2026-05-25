// Local, gitignored run log + state. No secrets ever written here.
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';

export function findRoot(start = process.cwd()) {
  let dir = start;
  for (let i = 0; i < 12; i++) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return start;
}

const ROOT = findRoot();
const DIR = join(ROOT, '.agenticos');
const RUNS = join(DIR, 'runs.jsonl');
const STATE = join(DIR, 'state.json');

function ensureDir() {
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
}

export function logRun(entry) {
  try {
    ensureDir();
    appendFileSync(RUNS, `${JSON.stringify({ ts: new Date().toISOString(), ...entry })}\n`);
  } catch {
    /* never let logging break a command */
  }
}

export function recentRuns(n = 10) {
  if (!existsSync(RUNS)) return [];
  const lines = readFileSync(RUNS, 'utf8').split('\n').filter(Boolean);
  return lines
    .slice(-n)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .reverse();
}

export function readState() {
  if (!existsSync(STATE)) return {};
  try {
    return JSON.parse(readFileSync(STATE, 'utf8'));
  } catch {
    return {};
  }
}

export function writeState(patch) {
  try {
    ensureDir();
    const next = { ...readState(), ...patch, updatedAt: new Date().toISOString() };
    writeFileSync(STATE, `${JSON.stringify(next, null, 2)}\n`);
    return next;
  } catch {
    return patch;
  }
}

export const paths = { ROOT, DIR, RUNS, STATE };
