export default async function handler(req, res) {
  // CORS — allow any origin (GitHub Pages, local dev, etc.)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!process.env.FINNHUB_KEY) {
    return res.status(500).json({ error: 'FINNHUB_KEY environment variable is not set' });
  }

  const symbol = (req.query.symbol || 'GLD').trim().toUpperCase();

  // Only allow known ETF proxies — prevents open-proxy abuse
  const ALLOWED = new Set(['GLD', 'QQQ', 'SPY']);
  if (!ALLOWED.has(symbol)) {
    return res.status(400).json({ error: `Symbol "${symbol}" is not supported. Allowed: GLD, QQQ, SPY` });
  }

  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${process.env.FINNHUB_KEY}`;
    const upstream = await fetch(url);

    if (!upstream.ok) {
      const text = await upstream.text();
      return res.status(upstream.status).json({ error: `Finnhub error ${upstream.status}`, detail: text });
    }

    const data = await upstream.json();

    // Validate Finnhub responded with actual quote data
    if (typeof data.c !== 'number' || data.c === 0) {
      return res.status(502).json({ error: 'Invalid or empty Finnhub response', raw: data });
    }

    return res.status(200).json({
      c: data.c,
      o: data.o,
      h: data.h,
      l: data.l,
      pc: data.pc,
      dp: data.dp,
      t: data.t,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
