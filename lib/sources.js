// Whitelist de fontes confiáveis. SÓ notícias destes domínios entram no dashboard.
// Para incluir/remover uma fonte, edite esta lista.
const LIST = [
  // Imprensa geral e política
  ['g1.globo.com', 'g1'],
  ['oglobo.globo.com', 'O Globo'],
  ['cnnbrasil.com.br', 'CNN Brasil'],
  ['estadao.com.br', 'Estadão'],
  ['folha.uol.com.br', 'Folha de S.Paulo'],
  ['poder360.com.br', 'Poder360'],
  ['agenciabrasil.ebc.com.br', 'Agência Brasil'],
  // Economia, mercados e negócios
  ['valor.globo.com', 'Valor Econômico'],
  ['valorinveste.globo.com', 'Valor Investe'],
  ['pipelinevalor.globo.com', 'Pipeline (Valor)'],
  ['infomoney.com.br', 'InfoMoney'],
  ['braziljournal.com', 'Brazil Journal'],
  ['exame.com', 'Exame'],
  ['moneytimes.com.br', 'Money Times'],
  ['bloomberglinea.com.br', 'Bloomberg Línea'],
  // Internacional
  ['ft.com', 'Financial Times'],
  ['bloomberg.com', 'Bloomberg'],
  ['reuters.com', 'Reuters'],
  ['wsj.com', 'The Wall Street Journal'],
  ['economist.com', 'The Economist'],
  // Energia, saneamento e infraestrutura
  ['canalenergia.com.br', 'CanalEnergia'],
  ['megawhat.energy', 'MegaWhat'],
  ['brasilenergia.com.br', 'Brasil Energia'],
  ['eixos.com.br', 'eixos'],
  ['agenciainfra.com', 'Agência iNFRA'],
  // Órgãos oficiais
  ['bcb.gov.br', 'Banco Central'],
  ['ccee.org.br', 'CCEE'],
  ['gov.br', 'gov.br (oficial)'],
];

// Domínios mais específicos primeiro (ex.: valorinveste.globo.com antes de globo.com)
const SOURCES = [...LIST].sort((a, b) => b[0].length - a[0].length);

export const SOURCE_NAMES = LIST.map(([, n]) => n);

export function sourceFromUrl(url) {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    for (const [domain, name] of SOURCES) {
      if (host === domain || host.endsWith('.' + domain)) {
        // ANEEL fica em gov.br/aneel
        if (domain === 'gov.br' && /\/aneel/i.test(url)) return { domain, name: 'ANEEL' };
        return { domain, name };
      }
    }
  } catch { /* URL inválida */ }
  return null;
}
