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
