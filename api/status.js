import { getStatus } from '../lib/aggregate.js';

// GET /api/status → mostra quais feeds responderam e quantas notícias cada um trouxe
export default async function handler(req, res) {
  try {
    const data = await getStatus();
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=900');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
}
