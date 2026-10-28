import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: false,
  parseAttributeValue: false,
  processEntities: true,
  htmlEntities: true,
  trimValues: true,
});

const arr = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const text = (v) => {
  if (v == null) return '';
  if (Array.isArray(v)) return text(v[0]);
  if (typeof v === 'object') return String(v['#text'] ?? v['@_href'] ?? '');
  return String(v);
};

export function parseFeed(xml) {
  const d = parser.parse(xml);
  if (d?.rss?.channel) {
    return arr(d.rss.channel.item).map((it) => ({
      title: text(it.title),
      link: text(it.link) || text(it.guid),
      date: text(it.pubDate) || text(it['dc:date']),
      description: text(it.description) || text(it['content:encoded']),
      sourceUrl: it.source?.['@_url'] || '',
    }));
  }
  if (d?.feed) {
    return arr(d.feed.entry).map((e) => {
      const links = arr(e.link);
      const l = links.find((x) => typeof x === 'object' && (x['@_rel'] === 'alternate' || !x['@_rel'])) || links[0];
      return {
        title: text(e.title),
        link: typeof l === 'object' ? l['@_href'] || '' : text(l),
        date: text(e.published) || text(e.updated),
        description: text(e.summary) || text(e.content),
        sourceUrl: '',
      };
    });
  }
  if (d?.['rdf:RDF']) {
    return arr(d['rdf:RDF'].item).map((it) => ({
      title: text(it.title), link: text(it.link), date: text(it['dc:date']), description: text(it.description), sourceUrl: '',
    }));
  }
  return [];
}

const ENT = { nbsp: ' ', amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', ndash: '–', mdash: '—', hellip: '…', laquo: '«', raquo: '»', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’' };

export function cleanHtml(s = '') {
  return String(s)
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&([a-z]+);/gi, (m, e) => ENT[e.toLowerCase()] ?? m)
    .replace(/\s+/g, ' ')
    .trim();
}

// Remove rodapés automáticos de WordPress ("O post X apareceu primeiro em Y", "Leia mais", etc.)
export function stripFooter(s = '') {
  return s
    .replace(/\s*(The post|O post|O artigo)\s.+?(appeared first on|apareceu primeiro em).*$/i, '')
    .replace(/\s*(Leia mais|Continue lendo|Read more)\s*(\.\.\.|…|»)?\s*$/i, '')
    .replace(/\s*\[(…|\.\.\.)\]\s*$/, '…')
    .trim();
}

export function truncate(s, n = 320) {
  if (!s || s.length <= n) return s;
  const cut = s.slice(0, n);
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), n - 40)).replace(/[\s,;:.–—-]+$/, '') + '…';
}

export function normTitle(s = '') {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}
