// Categorias (abas) e feeds de origem.
// Dois tipos de feed:
//  - "direct": RSS oficial do próprio veículo (traz resumo/lead e link direto da matéria)
//  - "gnews":  busca do Google News RESTRITA por site: às fontes confiáveis
//              (cobre veículos sem RSS público, como Valor, Estadão, Bloomberg, FT)
// Em ambos os casos, cada notícia ainda passa pela whitelist de lib/sources.js.

export const CATEGORIES = {
  politica: 'Política',
  economia: 'Economia',
  bolsa: 'Bolsa',
  capitais: 'Capitais & Dívida',
  utilities: 'Utilities',
  global: 'Internacional',
};

const gnews = (q, lang = 'pt') => {
  const loc = lang === 'en' ? 'hl=en-US&gl=US&ceid=US:en' : 'hl=pt-BR&gl=BR&ceid=BR:pt-419';
  return `https://news.google.com/rss/search?q=${encodeURIComponent(q + ' when:3d')}&${loc}`;
};
const sites = (...d) => '(' + d.map((x) => 'site:' + x).join(' OR ') + ')';

// Buscas CURTAS: o Google News ignora partes de consultas longas e devolve manchetes genéricas.
// Por isso cada feed tem no máximo ~4 termos e ~4 sites. O conteúdo de cada notícia ainda é
// conferido depois (lib/classify.js → refineCats).
const SG_BR = ['valor.globo.com', 'estadao.com.br', 'oglobo.globo.com', 'folha.uol.com.br'];
const SG_MKT1 = ['valor.globo.com', 'infomoney.com.br', 'braziljournal.com', 'exame.com'];
const SG_MKT2 = ['moneytimes.com.br', 'bloomberglinea.com.br', 'pipelinevalor.globo.com', 'estadao.com.br'];
const SG_ENER = ['canalenergia.com.br', 'megawhat.energy', 'brasilenergia.com.br', 'eixos.com.br', 'agenciainfra.com'];
const INTL = ['bloomberg.com', 'reuters.com', 'ft.com'];

const or = (terms) => '(' + terms.map((t) => (t.includes(' ') ? `"${t}"` : t)).join(' OR ') + ')';

// Gera um feed por combinação (grupo de termos × grupo de sites)
function gq(prefix, cat, termGroups, siteGroups, lang = 'pt') {
  const out = [];
  termGroups.forEach((terms, i) => siteGroups.forEach((sg, j) => out.push({
    id: `${prefix}-${i}${j}`, type: 'gnews', cat,
    name: `Google News · ${CATEGORIES[cat]} · ${terms.join(', ')} (${sg.join(', ')})`,
    url: gnews(`${or(terms)} ${sites(...sg)}`, lang),
  })));
  return out;
}

export const FEEDS = [
  // ---------- POLÍTICA ----------
  { id: 'g1-pol', name: 'g1 Política', type: 'direct', cat: 'politica', url: 'https://g1.globo.com/rss/g1/politica/' },
  { id: 'cnn-pol', name: 'CNN Brasil Política', type: 'direct', cat: 'politica', url: 'https://www.cnnbrasil.com.br/politica/feed/' },
  { id: 'folha-poder', name: 'Folha Poder', type: 'direct', cat: 'politica', url: 'https://feeds.folha.uol.com.br/poder/rss091.xml' },
  { id: 'abr-pol', name: 'Agência Brasil Política', type: 'direct', cat: 'politica', url: 'https://agenciabrasil.ebc.com.br/rss/politica/feed.xml' },
  { id: 'im-pol', name: 'InfoMoney Política', type: 'direct', cat: 'politica', url: 'https://www.infomoney.com.br/politica/feed/' },
  ...gq('gn-pol', 'politica', [['Congresso', 'Senado', 'STF'], ['Lula', 'Planalto', 'ministro']], [SG_BR]),

  // ---------- ECONOMIA ----------
  { id: 'g1-eco', name: 'g1 Economia', type: 'direct', cat: 'economia', url: 'https://g1.globo.com/rss/g1/economia/' },
  { id: 'cnn-eco', name: 'CNN Brasil Economia', type: 'direct', cat: 'economia', url: 'https://www.cnnbrasil.com.br/economia/feed/' },
  { id: 'im-eco', name: 'InfoMoney Economia', type: 'direct', cat: 'economia', url: 'https://www.infomoney.com.br/economia/feed/' },
  { id: 'abr-eco', name: 'Agência Brasil Economia', type: 'direct', cat: 'economia', url: 'https://agenciabrasil.ebc.com.br/rss/economia/feed.xml' },
  { id: 'folha-mercado', name: 'Folha Mercado', type: 'direct', cat: 'auto', fallback: 'economia', url: 'https://feeds.folha.uol.com.br/mercado/rss091.xml' },
  ...gq('gn-eco', 'economia', [['inflação', 'IPCA', 'Copom', 'Selic'], ['fiscal', 'Haddad', 'arcabouço', 'PIB']], [SG_BR]),
  ...gq('gn-eco-en', 'economia', [['Brazil economy', 'Brazil central bank', 'Brazil inflation']], [INTL], 'en'),

  // ---------- BOLSA ----------
  { id: 'im-mercados', name: 'InfoMoney Mercados', type: 'direct', cat: 'bolsa', url: 'https://www.infomoney.com.br/mercados/feed/' },
  ...gq('gn-bolsa', 'bolsa', [['Ibovespa', 'B3'], ['dividendos', 'balanço trimestral', 'lucro líquido']], [SG_MKT1, SG_MKT2]),
  ...gq('gn-bolsa-en', 'bolsa', [['Brazil stocks', 'Ibovespa', 'Brazilian shares']], [INTL], 'en'),

  // ---------- CAPITAIS & DÍVIDA ----------
  { id: 'braziljournal', name: 'Brazil Journal', type: 'direct', cat: 'auto', fallback: 'bolsa', url: 'https://braziljournal.com/feed/' },
  ...gq('gn-cap', 'capitais', [['debêntures', 'emissão de dívida', 'crédito privado'], ['IPO', 'follow-on', 'oferta de ações'], ['juros futuros', 'Tesouro Nacional', 'curva de juros']], [SG_MKT1, SG_MKT2]),
  ...gq('gn-cap-en', 'capitais', [['Brazil bonds', 'Brazil debt', 'Brazil IPO']], [INTL], 'en'),

  // ---------- INTERNACIONAL (só o que afeta o Brasil) ----------
  ...gq('gn-global', 'global', [['Fed', 'Treasuries', 'juros americanos'], ['petróleo', 'minério de ferro', 'economia chinesa']], [SG_MKT1]),
  ...gq('gn-global-en', 'global', [['Fed rates', 'Treasury yields'], ['oil prices', 'iron ore', 'China economy']], [INTL], 'en'),

  // ---------- UTILITIES ----------
  ...gq('gn-ener-set', 'utilities', [['energia', 'ANEEL'], ['transmissão', 'leilão'], ['distribuidoras', 'geração']], [SG_ENER]),
  ...gq('gn-ener', 'utilities', [['setor elétrico', 'ANEEL', 'conta de luz']], [SG_BR, SG_MKT1]),
  ...gq('gn-ener-emp', 'utilities', [['Eletrobras', 'Axia', 'Cemig', 'Copel'], ['Equatorial', 'CPFL', 'Energisa', 'Neoenergia'], ['Taesa', 'Auren', 'Eneva', 'Engie Brasil']], [SG_MKT1]),
  ...gq('gn-san', 'utilities', [['saneamento', 'Sabesp'], ['Copasa', 'Sanepar', 'Aegea']], [SG_MKT1, SG_BR]),
  ...gq('gn-res', 'utilities', [['aterro sanitário', 'resíduos sólidos', 'Orizon']], [SG_MKT1]),
];
