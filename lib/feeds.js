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

const BR_ECON = ['valor.globo.com', 'estadao.com.br', 'oglobo.globo.com', 'folha.uol.com.br', 'exame.com'];
const MERCADO = ['valor.globo.com', 'valorinveste.globo.com', 'infomoney.com.br', 'braziljournal.com', 'moneytimes.com.br', 'exame.com', 'estadao.com.br', 'bloomberglinea.com.br'];
const INTL = ['bloomberg.com', 'reuters.com', 'ft.com'];
const SETORIAL = ['canalenergia.com.br', 'megawhat.energy', 'brasilenergia.com.br', 'eixos.com.br', 'agenciainfra.com'];

export const FEEDS = [
  // ---------- POLÍTICA ----------
  { id: 'g1-pol', name: 'g1 Política', type: 'direct', cat: 'politica', url: 'https://g1.globo.com/rss/g1/politica/' },
  { id: 'cnn-pol', name: 'CNN Brasil Política', type: 'direct', cat: 'politica', url: 'https://www.cnnbrasil.com.br/politica/feed/' },
  { id: 'folha-poder', name: 'Folha Poder', type: 'direct', cat: 'politica', url: 'https://feeds.folha.uol.com.br/poder/rss091.xml' },
  { id: 'abr-pol', name: 'Agência Brasil Política', type: 'direct', cat: 'politica', url: 'https://agenciabrasil.ebc.com.br/rss/politica/feed.xml' },
  { id: 'im-pol', name: 'InfoMoney Política', type: 'direct', cat: 'politica', url: 'https://www.infomoney.com.br/politica/feed/' },
  { id: 'gn-pol', name: 'Google News · Política (Valor/Estadão/O Globo)', type: 'gnews', cat: 'politica',
    url: gnews(`(Congresso OR Senado OR Câmara OR STF OR Planalto OR Lula OR ministro OR eleições) ${sites('valor.globo.com', 'estadao.com.br', 'oglobo.globo.com')}`) },

  // ---------- ECONOMIA ----------
  { id: 'g1-eco', name: 'g1 Economia', type: 'direct', cat: 'economia', url: 'https://g1.globo.com/rss/g1/economia/' },
  { id: 'cnn-eco', name: 'CNN Brasil Economia', type: 'direct', cat: 'economia', url: 'https://www.cnnbrasil.com.br/economia/feed/' },
  { id: 'im-eco', name: 'InfoMoney Economia', type: 'direct', cat: 'economia', url: 'https://www.infomoney.com.br/economia/feed/' },
  { id: 'abr-eco', name: 'Agência Brasil Economia', type: 'direct', cat: 'economia', url: 'https://agenciabrasil.ebc.com.br/rss/economia/feed.xml' },
  { id: 'folha-mercado', name: 'Folha Mercado', type: 'direct', cat: 'auto', fallback: 'economia', url: 'https://feeds.folha.uol.com.br/mercado/rss091.xml' },
  { id: 'gn-eco', name: 'Google News · Economia BR', type: 'gnews', cat: 'economia',
    url: gnews(`(inflação OR IPCA OR PIB OR Selic OR Copom OR "Banco Central" OR fiscal OR Haddad OR câmbio OR dólar) ${sites(...BR_ECON)}`) },
  { id: 'gn-eco-en', name: 'Google News · Brazil economy (FT/Bloomberg/Reuters)', type: 'gnews', cat: 'economia',
    url: gnews(`Brazil (economy OR inflation OR "central bank" OR fiscal OR Lula) ${sites(...INTL)}`, 'en') },

  // ---------- BOLSA ----------
  { id: 'im-mercados', name: 'InfoMoney Mercados', type: 'direct', cat: 'bolsa', url: 'https://www.infomoney.com.br/mercados/feed/' },
  { id: 'gn-bolsa', name: 'Google News · Bolsa', type: 'gnews', cat: 'bolsa',
    url: gnews(`(Ibovespa OR B3 OR ações OR dividendos OR balanço OR resultado trimestral) ${sites(...MERCADO)}`) },
  { id: 'gn-bolsa-en', name: 'Google News · Brazil stocks (internacional)', type: 'gnews', cat: 'bolsa',
    url: gnews(`(Ibovespa OR "Brazilian stocks" OR "Brazil stocks" OR "Sao Paulo stock") ${sites(...INTL)}`, 'en') },

  // ---------- CAPITAIS & DÍVIDA ----------
  { id: 'braziljournal', name: 'Brazil Journal', type: 'direct', cat: 'auto', fallback: 'bolsa', url: 'https://braziljournal.com/feed/' },
  { id: 'gn-cap', name: 'Google News · Mercado de capitais', type: 'gnews', cat: 'capitais',
    url: gnews(`(debêntures OR debênture OR IPO OR follow-on OR "oferta de ações" OR "emissão de dívida" OR "crédito privado" OR CRI OR CRA OR FIDC OR "renda fixa") ${sites('valor.globo.com', 'pipelinevalor.globo.com', 'braziljournal.com', 'infomoney.com.br', 'exame.com', 'estadao.com.br', 'bloomberglinea.com.br', 'valorinveste.globo.com')}`) },
  { id: 'gn-juros', name: 'Google News · Juros e Tesouro', type: 'gnews', cat: 'capitais',
    url: gnews(`("juros futuros" OR "curva de juros" OR "Tesouro Nacional" OR "títulos públicos" OR "Tesouro Direto" OR "dívida pública" OR "DI futuro") ${sites('valor.globo.com', 'infomoney.com.br', 'estadao.com.br', 'exame.com', 'moneytimes.com.br', 'bloomberglinea.com.br')}`) },
  { id: 'gn-cap-en', name: 'Google News · Brazil bonds (internacional)', type: 'gnews', cat: 'capitais',
    url: gnews(`Brazil (bonds OR bond OR debt OR IPO OR "credit rating") ${sites(...INTL)}`, 'en') },

  // ---------- INTERNACIONAL (fatores externos que afetam o Brasil) ----------
  { id: 'gn-global', name: 'Google News · Cenário externo', type: 'gnews', cat: 'global',
    url: gnews(`(Fed OR "juros americanos" OR Treasuries OR China OR petróleo OR "minério de ferro" OR "Wall Street" OR "guerra comercial" OR "Banco Central Europeu") ${sites('valor.globo.com', 'infomoney.com.br', 'estadao.com.br', 'exame.com', 'bloomberglinea.com.br', 'braziljournal.com')}`) },
  { id: 'gn-global-en', name: 'Google News · Global markets (FT/Bloomberg/Reuters)', type: 'gnews', cat: 'global',
    url: gnews(`(Fed OR "Treasury yields" OR "China economy" OR "oil prices" OR "iron ore" OR "emerging markets" OR tariffs) ${sites(...INTL)}`, 'en') },

  // ---------- UTILITIES ----------
  { id: 'gn-energia-set', name: 'Google News · Imprensa setorial de energia', type: 'gnews', cat: 'utilities',
    url: gnews(`(energia OR ANEEL OR ONS OR CCEE OR transmissão OR distribuidora OR geração OR leilão) ${sites(...SETORIAL)}`) },
  { id: 'gn-energia', name: 'Google News · Energia elétrica', type: 'gnews', cat: 'utilities',
    url: gnews(`("setor elétrico" OR "energia elétrica" OR ANEEL OR "leilão de transmissão" OR "leilão de energia" OR "conta de luz" OR "bandeira tarifária" OR distribuidoras) ${sites('valor.globo.com', 'estadao.com.br', 'infomoney.com.br', 'braziljournal.com', 'folha.uol.com.br', 'oglobo.globo.com', 'exame.com')}`) },
  { id: 'gn-empresas-energia', name: 'Google News · Empresas de energia', type: 'gnews', cat: 'utilities',
    url: gnews(`(Eletrobras OR Axia OR Equatorial OR Energisa OR Cemig OR Copel OR CPFL OR Neoenergia OR Engie OR Taesa OR "ISA Energia" OR Alupar OR Auren OR Eneva OR "EDP Brasil") ${sites(...MERCADO, 'valorinveste.globo.com')}`) },
  { id: 'gn-saneamento', name: 'Google News · Saneamento', type: 'gnews', cat: 'utilities',
    url: gnews(`(saneamento OR Sabesp OR Copasa OR Sanepar OR Aegea OR Iguá OR "água e esgoto" OR "marco do saneamento") ${sites('valor.globo.com', 'estadao.com.br', 'infomoney.com.br', 'braziljournal.com', 'oglobo.globo.com', 'g1.globo.com', 'folha.uol.com.br', 'agenciainfra.com', 'exame.com')}`) },
  { id: 'gn-residuos', name: 'Google News · Resíduos e aterros', type: 'gnews', cat: 'utilities',
    url: gnews(`(aterro OR "aterros sanitários" OR "resíduos sólidos" OR Orizon OR biometano) ${sites('valor.globo.com', 'estadao.com.br', 'infomoney.com.br', 'braziljournal.com', 'exame.com', 'agenciainfra.com', 'eixos.com.br')}`) },
];
