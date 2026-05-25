// Thin wrappers around the GitHub CLI. Every call degrades gracefully:
// callers check available()/authed() first and render a banner if not.
import { execFileSync } from 'node:child_process';

const PR_FIELDS =
  'number,title,author,headRefName,baseRefName,isDraft,mergeable,reviewDecision,statusCheckRollup,labels,url,additions,deletions,changedFiles';

function run(args, opts = {}) {
  return execFileSync('gh', args, {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'],
    ...opts,
  });
}

export function available() {
  try {
    run(['--version']);
    return true;
  } catch {
    return false;
  }
}

export function authed() {
  try {
    execFileSync('gh', ['auth', 'status'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function status() {
  if (!available()) return { ok: false, reason: 'gh CLI not installed' };
  if (!authed()) return { ok: false, reason: 'gh not authenticated (run: gh auth login)' };
  return { ok: true, reason: null };
}

function json(args) {
  return JSON.parse(run(args));
}

export function prList() {
  return json(['pr', 'list', '--state', 'open', '--limit', '50', '--json', PR_FIELDS]);
}

export function prView(num) {
  return json(['pr', 'view', String(num), '--json', `${PR_FIELDS},body,files,reviews,commits`]);
}

export function issuesList() {
  return json([
    'issue',
    'list',
    '--state',
    'open',
    '--limit',
    '50',
    '--json',
    'number,title,labels,url,author',
  ]);
}

export function runsForBranch(branch, limit = 10) {
  try {
    return json([
      'run',
      'list',
      '--branch',
      branch,
      '--limit',
      String(limit),
      '--json',
      'workflowName,status,conclusion,headBranch,event,url,createdAt',
    ]);
  } catch {
    return [];
  }
}
