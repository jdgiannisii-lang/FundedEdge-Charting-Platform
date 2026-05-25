// Pure logic: normalize a PR's CI checks and compute the ready-to-merge verdict.

function itemVerdict(it) {
  // StatusContext (legacy commit statuses): has `state`.
  if (it.__typename === 'StatusContext' || it.state) {
    const s = String(it.state || '').toUpperCase();
    if (s === 'SUCCESS') return 'pass';
    if (s === 'PENDING' || s === 'EXPECTED') return 'pending';
    return 'fail';
  }
  // CheckRun: has `status` + `conclusion`.
  if (String(it.status || '').toUpperCase() !== 'COMPLETED') return 'pending';
  const conclusion = String(it.conclusion || '').toUpperCase();
  if (['SUCCESS', 'NEUTRAL', 'SKIPPED'].includes(conclusion)) return 'pass';
  return 'fail';
}

export function rollupChecks(pr) {
  const items = (pr.statusCheckRollup || []).map((it) => ({
    name: it.name || it.context || 'check',
    url: it.detailsUrl || it.targetUrl || '',
    verdict: itemVerdict(it),
  }));
  const failed = items.filter((i) => i.verdict === 'fail');
  const pending = items.filter((i) => i.verdict === 'pending');
  let verdict;
  if (items.length === 0) verdict = 'none';
  else if (failed.length) verdict = 'fail';
  else if (pending.length) verdict = 'pending';
  else verdict = 'pass';
  return { items, failed, pending, verdict };
}

// Returns { ready, reasons[], primary, checks }.
// primary = the single most-blocking reason for compact one-line display.
export function evaluate(pr) {
  const checks = rollupChecks(pr);
  const reasons = [];

  if (pr.isDraft) reasons.push({ kind: 'draft', level: 'block', text: 'draft' });

  if (pr.mergeable === 'CONFLICTING')
    reasons.push({ kind: 'conflict', level: 'fail', text: 'merge conflicts' });
  else if (pr.mergeable === 'UNKNOWN')
    reasons.push({ kind: 'mergeability', level: 'pending', text: 'mergeability unknown' });

  if (checks.verdict === 'fail') {
    const names = checks.failed.map((f) => f.name).join(', ');
    reasons.push({ kind: 'ci', level: 'fail', text: `CI failing (${names})` });
  } else if (checks.verdict === 'pending') {
    reasons.push({ kind: 'ci', level: 'pending', text: 'checks pending' });
  }

  if (pr.reviewDecision === 'CHANGES_REQUESTED')
    reasons.push({ kind: 'review', level: 'fail', text: 'changes requested' });
  else if (pr.reviewDecision !== 'APPROVED')
    reasons.push({ kind: 'review', level: 'review', text: 'needs review' });

  // Priority order for the compact line.
  const order = ['draft', 'conflict', 'ci', 'review', 'mergeability'];
  const primary =
    reasons.slice().sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))[0] || null;

  return { ready: reasons.length === 0, reasons, primary, checks };
}
