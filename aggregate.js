import { FEEDS, CATEGORIES } from './feeds.js';
import { parseFeed, cleanHtml, stripFooter, truncate, normTitle } from './parse.js';
import { sourceFromUrl } from './sources.js';
import { classify, isUtilities, utilitySub, extractTickers } from './classify.js';

const TTL = 5 * 60 * 1000; // cache em memória por instância (5 min)
let cache = null;
let inflight = null;

async function fetchXml(url, ms = 8000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, {
      signal: ctl.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; RadarBrasil/1.0; leitor de RSS)',
        accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    // Respeita o charset declarado (Folha, por exemplo, usa ISO-8859-1)
    const head = buf.subarray(0, 300).toString('latin1');
    const charset = (r.headers.get('content-type') || '').match(/charset=([\w-]+)/i)?.[1]
      || head.match(/encoding=["']([\w-]+)["']/i)?.[1] || 'utf-8';
    try { return new TextDecoder(charset.toLowerCase()).decode(buf); }
    catch { return buf.toString('utf8'); }
  } finally {
    clearTimeout(t);
  }
}

function normalize(raw, feed) {
  let title = cleanHtml(raw.title);
  if (!title || !raw.link) return null;

  let src;
  if (feed.type === 'gnews') {
    src = sourceFromUrl(raw.sourceUrl);
    const i = title.lastIndexOf(' - ');
    if (i > 15) title = title.slice(0, i).trim(); // remove " - Nome do veículo"
  } else {
    src = sourceFromUrl(raw.link);
  }
  if (!src) return null; // fora da whitelist → descartado

  const ts = Date.parse(raw.date);
  if (Number.isNaN(ts) || ts > Date.now() + 3600e3) return null;

  let summary = '';
  if (feed.type !== 'gnews') {
    summary = truncate(stripFooter(cleanHtml(raw.description)), 320);
    if (summary && normTitle(summary).startsWith(normTitle(title).slice(0, 40))) summary = '';
  }

  const full = `${title} ${summary}`;
  const cats = new Set();
  if (feed.cat === 'auto') cats.add(classify(full, feed.fallback));
  else cats.add(feed.cat);
  if (isUtilities(full)) cats.add('utilities'); // notícia de utilities em feed geral também aparece na aba

  return {
    title,
    summary,
    link: raw.link.trim(),
    source: src.name,
    domain: src.domain,
    publishedAt: new Date(ts).toISOString(),
    ts,
    cats: [...cats].filter(Boolean),
    sub: cats.has('utilities') ? utilitySub(full) : null,
    tickers: extractTickers(full),
    via: feed.type,
  };
}

async function loadAll() {
  const results = await Promise.allSettled(FEEDS.map(async (f) => {
    const xml = await fetchXml(f.url);
    const items = parseFeed(xml).map((r) => normalize(r, f)).filter(Boolean);
    return { feed: f, items };
  }));

  const status = [];
  const byKey = new Map();
  results.forEach((r, i) => {
    const f = FEEDS[i];
    if (r.status === 'rejected') {
      status.push({ id: f.id, name: f.name, ok: false, error: String(r.reason?.message || r.reason) });
      return;
    }
    status.push({ id: f.id, name: f.name, ok: true, count: r.value.items.length });
    for (const it of r.value.items) {
      const key = normTitle(it.title).slice(0, 70);
      const prev = byKey.get(key);
      if (!prev) { byKey.set(key, it); continue; }
      // Mantém a versão com resumo / link direto e une as categorias
      const better = (!prev.summary && it.summary) || (prev.via === 'gnews' && it.via === 'direct') ? it : prev;
      better.cats = [...new Set([...prev.cats, ...it.cats])];
      better.sub = better.sub || prev.sub || it.sub;
      better.tickers = [...new Set([...prev.tickers, ...it.tickers])].slice(0, 5);
      byKey.set(key, better);
    }
  });

  const items = [...byKey.values()].sort((a, b) => b.ts - a.ts);
  return { updatedAt: new Date().toISOString(), items, status };
}

export async function getAll() {
  if (cache && Date.now() - cache.t < TTL) return cache.data;
  if (!inflight) {
    inflight = loadAll()
      .then((data) => { cache = { t: Date.now(), data }; return data; })
      .finally(() => { inflight = null; });
  }
  return inflight;
}

export async function getNews(cat = 'all', hours = 72) {
  const data = await getAll();
  const since = Date.now() - hours * 3600e3;
  const items = data.items
    .filter((it) => it.ts >= since && (cat === 'all' || it.cats.includes(cat)))
    .map(({ ts, ...rest }) => rest);
  return { updatedAt: data.updatedAt, category: cat, categories: CATEGORIES, count: items.length, items };
}

export async function getStatus() {
  const data = await getAll();
  return { updatedAt: data.updatedAt, feeds: data.status };
}
