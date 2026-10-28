// Classificação por palavras-chave (usada em feeds gerais e para marcar subtemas de Utilities).
const W = (alts) => new RegExp(`(?<![\\p{L}\\d])(?:${alts})(?![\\p{L}\\d])`, 'iu');

const ENERGIA = W([
  'energia elétrica', 'setor elétrico', 'aneel', 'ons', 'ccee', 'transmissão de energia', 'transmissoras?',
  'distribuidoras?( de energia)?', 'hidrelétricas?', 'eólicas?', 'energia solar', 'termelétricas?',
  'leilão de (energia|transmissão|reserva de capacidade)', 'conta de luz', 'bandeira tarifária', 'tarifa de energia',
  'mercado livre de energia', 'geração distribuída', 'eletrobras', 'axia', 'cemig', 'copel', 'cpfl', 'equatorial',
  'energisa', 'neoenergia', 'engie', 'taesa', 'isa energia', 'alupar', 'auren', 'eneva', 'edp brasil', 'enel', 'itaipu',
].join('|'));
const SANEAMENTO = W(['saneamento', 'sabesp', 'copasa', 'sanepar', 'aegea', 'iguá', 'cedae', 'água e esgoto', 'esgotamento sanitário', 'marco do saneamento', 'corsan', 'casan', 'embasa'].join('|'));
const RESIDUOS = W(['aterros?( sanitários?)?', 'resíduos sólidos', 'resíduos', 'orizon', 'lixões?', 'biometano', 'coleta de lixo'].join('|'));

const RULES = [
  ['utilities', null], // tratado pelas três regex acima
  ['capitais', W(['debêntures?', 'renda fixa', 'emissão de (dívida|debêntures|títulos)', 'ipo', 'follow-on', 'oferta (de ações|subsequente|primária|secundária)', 'bonds?', 'eurobonds?', 'títulos públicos', 'tesouro (direto|nacional)', 'curva de juros', 'juros futuros', 'di futuro', 'crédito privado', 'cri', 'cra', 'fidcs?', 'rating', 'securitiza\\p{L}*', 'captação', 'cvm'].join('|'))],
  ['bolsa', W(['ibovespa', 'ibov', 'b3', 'ações', 'bolsa', 'dividendos', 'jcp', 'small caps?', 'balanço', 'lucro líquido', 'resultado trimestral', 'recompra', 'valor de mercado'].join('|'))],
  ['politica', W(['lula', 'congresso', 'câmara dos deputados', 'senado', 'stf', 'supremo', 'planalto', 'pec', 'deputados?', 'senador(es|a)?', 'eleições?', 'partidos?', 'ministros?', 'tarcísio', 'bolsonaro', 'tse'].join('|'))],
  ['economia', W(['inflação', 'ipca', 'pib', 'selic', 'copom', 'banco central', 'fiscal', 'arcabouço', 'desemprego', 'dólar', 'câmbio', 'haddad', 'orçamento', 'déficit', 'superávit', 'juros'].join('|'))],
];

export function isUtilities(text) {
  return ENERGIA.test(text) || SANEAMENTO.test(text) || RESIDUOS.test(text);
}

export function utilitySub(text) {
  if (SANEAMENTO.test(text)) return 'saneamento';
  if (RESIDUOS.test(text)) return 'residuos';
  if (ENERGIA.test(text)) return 'energia';
  return 'outros';
}

export function classify(text, fallback = null) {
  for (const [cat, re] of RULES) {
    if (cat === 'utilities' ? isUtilities(text) : re.test(text)) return cat;
  }
  return fallback;
}

// Tickers da B3 (ex.: SBSP3, ELET3, TAEE11)
export function extractTickers(text) {
  const m = text.match(/\b[A-Z]{4}(?:3|4|5|6|11)\b/g) || [];
  return [...new Set(m)].slice(0, 5);
}

/* ======================================================================
   FILTRO DE RELEVÂNCIA (aplicado depois de juntar todas as fontes)
   Objetivo: tudo o que é do Brasil + o que vem de fora e pode afetar o Brasil.
   ====================================================================== */
const G = (alts) => new RegExp(`(?<![\\p{L}\\d])(?:${alts})(?![\\p{L}\\d])`, 'giu');
const count = (re, s) => (s.match(re) || []).length;

// Marcadores de Brasil
const BR = G([
  'brasil', 'brasileir\\p{L}*', 'brazil', 'brazilian', 'ibovespa', 'ibov', 'b3', 'lula', 'haddad', 'galípolo',
  'copom', 'selic', 'bndes', 'cvm', 'tesouro (nacional|direto)', 'banco central', 'governo federal', 'congresso',
  'ipca', 'caged', 'ibge', 'petrobras', 'itaú', 'itau', 'bradesco', 'banco do brasil', 'btg', 'nubank', 'ambev',
  'embraer', 'suzano', 'gerdau', 'localiza', 'magalu', 'magazine luiza', 'raízen', 'jbs', 'brf', 'marfrig', 'weg',
  'rede d.or', 'hapvida', 'usiminas', 'csn', 'santander brasil', 'b3sa', 'são paulo', 'rio de janeiro', 'estatais?',
].join('|'));
const BR_CASE = /\b(Vale|Rumo|Natura|Minerva|Cosan|Azul|Gol|Oi|XP)\b(?! a pena)/; // nomes ambíguos: só com maiúscula
const REAL = /R\$\s?\d/;
const TICKER = /\b[A-Z]{4}(?:3|4|5|6|11)\b/;

// Fatores externos que costumam mexer com o Brasil
const EXT = G([
  'fed', 'federal reserve', 'powell', 'treasur(y|ies)', 'juros (americanos|nos eua|dos eua)', 'payroll', 'wall street',
  's&p 500', 'nasdaq', 'dow jones', 'china', 'chines\\p{L}*', 'pequim', 'petróleo', 'brent', 'wti', 'opep', 'opec',
  'minério de ferro', 'iron ore', 'oil', 'commodities', 'bce', 'banco central europeu', 'ecb', 'trump', 'casa branca',
  'eua', 'estados unidos', 'europa', 'zona do euro', 'japão', 'boj', 'emergentes', 'emerging markets', 'yields?',
  'tarifaço', 'guerra comercial', 'trade war', 'geopolític\\p{L}*', 'recessão', 'recession', 'dólar global', 'dxy',
].join('|'));

const POL = G([
  'lula', 'congresso', 'câmara', 'senado', 'stf', 'supremo', 'planalto', 'pec', 'deputad\\p{L}*', 'senador\\p{L}*',
  'eleiç\\p{L}*', 'eleitor\\p{L}*', 'partid\\p{L}*', 'tarcísio', 'bolsonaro', 'tse', 'pgr', 'polícia federal', 'pf',
  'cpi', 'inquérito', 'impeachment', 'governador\\p{L}*', 'prefeit\\p{L}*', 'candidat\\p{L}*', 'campanha',
  'moraes', 'fachin', 'gilmar', 'flávio', 'eduardo bolsonaro', 'michelle', 'oposição', 'aliados?', 'ministro do stf',
  'base governista', 'centrão', 'pt', 'pl', 'psdb', 'mdb', 'união brasil', 'psd', 'apoiadores', 'militância', 'passaporte',
].join('|'));

const ECO = G([
  'inflação', 'ipca', 'igp-?m', 'pib', 'selic', 'copom', 'banco central', 'fiscal', 'arcabouço', 'desemprego', 'emprego',
  'dólar', 'câmbio', 'haddad', 'fazenda', 'orçamento', 'déficit', 'superávit', 'juros', 'impostos?', 'tributár\\p{L}*',
  'imposto de renda', 'arrecadação', 'receita federal', 'crédito', 'varejo', 'indústria', 'exportaç\\p{L}*',
  'importaç\\p{L}*', 'commodities', 'salário mínimo', 'consumo', 'preços?', 'caged', 'ibge', 'tesouro', 'gasolina',
  'combustíve\\p{L}*', 'contas públicas', 'dívida pública', 'renda', 'bancos?', 'pix', 'economia', 'econômic\\p{L}*',
  'investimentos?', 'mercado', 'empresas?', 'agronegócio', 'safra', 'petróleo', 'economy', 'inflation', 'central bank',
  'rates?', 'budget', 'growth', 'gdp', 'real', 'currency',
].join('|'));

const BOLSA = G([
  'ibovespa', 'ibov', 'b3', 'ações', 'ação', 'bolsas?', 'dividendos', 'proventos', 'jcp', 'balanço', 'lucr\\p{L}*',
  'prejuízo', 'receita líquida', 'ebitda', 'resultados?', 'trimestre', '\\d+º tri', 'recompra', 'valor de mercado',
  'small caps?', 'etfs?', 'fiis?', 'fundos imobiliários', 'preço-alvo', 'recomendação', 'rebaixa', 'eleva', 'guidance',
  'acionistas?', 'investidores', 'stocks?', 'shares', 'equities', 'earnings', 'profit',
].join('|'));

const CAP = G([
  'debêntures?', 'ipos?', 'follow-on', 'ofertas?', 'emiss\\p{L}*', 'captaç\\p{L}*', 'bonds?', 'eurobonds?', 'títulos',
  'tesouro', 'juros futuros', 'curva de juros', 'di futuro', 'di', 'crédito privado', 'cri', 'cra', 'fidcs?', 'rating',
  'moody.s', 'fitch', 's&p global', 'securitiz\\p{L}*', 'cvm', 'renda fixa', 'dívida', 'endividamento', 'alavancagem',
  'refinanciamento', 'notas comerciais', 'ntn-b', 'lci', 'lca', 'spread', 'fusões', 'aquisiç\\p{L}*', 'm&a',
  'incorporação', 'participação', 'debt', 'issuance', 'credit rating', 'yields?', 'listing',
].join('|'));

// Ruído: loterias, entretenimento e "finanças pessoais" genéricas
const NOISE = G(['mega-sena', 'mega da virada', 'lotofácil', 'quina', 'loteria', 'horóscopo', 'bbb', 'big brother'].join('|'));
const PERSONAL = G([
  'quanto rende', 'quanto rendem', 'como investir', 'vale a pena', 'simulaç\\p{L}*', 'aposentadoria', 'dicas?',
  'passo a passo', 'como declarar', 'como sacar', 'consulte', 'veja como', 'calendário de pagamento', 'tabela do inss',
].join('|'));

// Pontuação: o título vale o dobro do resumo
const score = (re, t, s) => count(re, t) * 2 + count(re, s);

export function refineCats(item) {
  const t = item.title || '';
  const s = item.summary || '';
  const all = `${t} ${s}`;
  if (count(NOISE, all)) return [];

  const br = count(BR, all) + (BR_CASE.test(all) ? 1 : 0) + (REAL.test(all) ? 1 : 0) + (TICKER.test(all) ? 2 : 0) > 0;
  const ext = score(EXT, t, s);
  const pol = score(POL, t, s);
  const eco = score(ECO, t, s);
  const bol = score(BOLSA, t, s) + (TICKER.test(all) ? 2 : 0);
  const cap = score(CAP, t, s);
  const personal = count(PERSONAL, t) > 0;

  const cats = new Set(item.cats);
  const out = new Set();

  if (cats.has('utilities')) out.add('utilities');

  // Política: precisa ter termo político, ou pelo menos não ser claramente outro assunto
  if (cats.has('politica') && (pol > 0 || (eco === 0 && bol === 0 && cap === 0))) out.add('politica');

  if (cats.has('economia')) {
    if (pol > eco) out.add('politica');                // notícia política que veio por feed de economia
    else if (!br && ext > 0) out.add('global');        // economia de outro país → Internacional
    else if (eco > 0) out.add('economia');
  }

  if (cats.has('bolsa')) {
    if (br && bol > 0 && !personal) out.add('bolsa');
    else if (!br && ext > 0) out.add('global');
  }

  if (cats.has('capitais')) {
    if (br && cap > 0 && !personal) out.add('capitais');
    else if (!br && ext > 0) out.add('global');
  }

  if (cats.has('global')) {
    if (ext > 0) out.add('global');
  }

  // Notícia do Brasil de mercado/economia diretamente ligada a fator externo (ex.: "Ibovespa cai com Fed")
  if (br && ext >= 2 && (out.has('bolsa') || out.has('capitais') || out.has('economia'))) out.add('global');

  return [...out];
}
