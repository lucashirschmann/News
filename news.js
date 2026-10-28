import { getNews } from '../lib/aggregate.js';

// GET /api/news?cat=all|politica|economia|bolsa|capitais|utilities&hours=72
export default async function handler(req, res) {
  const cat = String(req.query.cat || 'all');
  const hours = Math.min(Math.max(parseInt(req.query.hours, 10) || 72, 1), 168);
  try {
    const data = await getNews(cat, hours);
    // Cache na CDN da Vercel: 5 min fresco, até 15 min servindo a versão anterior enquanto atualiza
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=900');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
}
