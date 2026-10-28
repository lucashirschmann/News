import { getNews } from '../lib/aggregate.js';
import { CATEGORIES } from '../lib/feeds.js';

// GET /api/briefing?cat=politica
// "Resumo do dia" opcional, gerado por IA a partir APENAS das manchetes coletadas.
// Só funciona se a variável de ambiente ANTHROPIC_API_KEY estiver configurada na Vercel.
const TTL = 30 * 60 * 1000;
const cache = new Map();

export default async function handler(req, res) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(200).json({ enabled: false });

  const cat = String(req.query.cat || 'all');
  const label = cat === 'all' ? 'Panorama geral (política, economia, mercados e utilities)' : CATEGORIES[cat] || cat;
  const hit = cache.get(cat);
  if (hit && Date.now() - hit.t < TTL) {
    res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600');
    return res.status(200).json(hit.v);
  }

  try {
    const { items } = await getNews(cat, 24);
    const top = items.slice(0, 30);
    if (top.length < 3) {
      return res.status(200).json({ enabled: true, bullets: [], note: 'Poucas notícias nas últimas 24h para resumir.' });
    }
    const list = top.map((it, i) => `[${i + 1}] (${it.source}) ${it.title}${it.summary ? ' — ' + it.summary : ''}`).join('\n');
    const prompt = `Você é um analista de equity research no Brasil preparando um resumo executivo.
Tema: ${label}

Com base EXCLUSIVAMENTE nas manchetes e leads abaixo (últimas 24h), escreva de 4 a 6 bullets curtos em português, em tom executivo, destacando o que é mais relevante para investidores.
Regras:
- Não invente fatos, números, nomes ou datas que não estejam no material.
- Use suas próprias palavras; não copie frases das manchetes.
- Cada bullet deve indicar os números [n] das manchetes em que se baseia.
- Responda SOMENTE com JSON válido, no formato {"bullets":[{"texto":"...","refs":[1,4]}]}

Manchetes:
${list}`;

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error?.message || 'Erro na API (' + r.status + ')');

    const txt = (j.content || []).map((c) => c.text || '').join('');
    const parsed = JSON.parse(txt.match(/\{[\s\S]*\}/)?.[0] || '{"bullets":[]}');
    const bullets = (parsed.bullets || []).map((b) => ({
      text: String(b.texto || b.text || '').trim(),
      refs: (b.refs || []).map((n) => top[Number(n) - 1]).filter(Boolean)
        .map((it) => ({ source: it.source, link: it.link, title: it.title })),
    })).filter((b) => b.text);

    const v = { enabled: true, generatedAt: new Date().toISOString(), bullets };
    cache.set(cat, { t: Date.now(), v });
    res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600');
    res.status(200).json(v);
  } catch (e) {
    res.status(200).json({ enabled: true, bullets: [], error: String(e?.message || e) });
  }
}
