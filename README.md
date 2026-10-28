# Radar Brasil

Dashboard de notícias com as manchetes mais recentes de **Política, Economia, Bolsa, Capitais & Dívida, Utilities** (energia, saneamento, resíduos/aterros) **e Internacional** (só fatores externos que afetam o Brasil: Fed, Treasuries, China, petróleo, minério), vindas só de uma lista fechada de veículos confiáveis. Cada card mostra o resumo (lead publicado pelo próprio veículo) e leva direto à matéria original.

## Como publicar na Vercel (10 minutos)

**Opção A: pelo GitHub (recomendado, atualiza sozinho a cada alteração)**
1. Crie um repositório no GitHub (pode ser privado) e suba esta pasta inteira.
2. Em vercel.com → *Add New… → Project* → importe o repositório.
3. Em *Framework Preset* deixe **Other**. Não precisa mudar nada mais. Clique em **Deploy**.

**Opção B: pelo terminal**
```bash
npm i -g vercel
cd radar-brasil
vercel        # primeira vez: responde às perguntas e cria o projeto
vercel --prod # publica em produção
```

Para testar localmente antes: `npm install` e depois `vercel dev` → http://localhost:3000

## Resumo do dia por IA (opcional)

No topo de cada aba pode aparecer um "Resumo do dia" com 4 a 6 bullets gerados a partir das manchetes coletadas, com link para cada fonte citada. Para ativar:

1. Crie uma chave em console.anthropic.com.
2. Na Vercel: *Project → Settings → Environment Variables* → adicione `ANTHROPIC_API_KEY`.
3. (Opcional) `ANTHROPIC_MODEL` para trocar o modelo (padrão: `claude-haiku-5-5`).
4. Faça um *Redeploy*.

Sem a chave, o painel funciona normalmente, só sem esse bloco. O resumo é cacheado por 30 min, então o custo fica baixo.

## Como funciona

| Peça | O que faz |
|---|---|
| `lib/sources.js` | **Whitelist de fontes.** Qualquer notícia de domínio fora desta lista é descartada. Edite aqui para incluir/remover veículos. |
| `lib/feeds.js` | Feeds por aba: RSS oficiais (g1, CNN Brasil, InfoMoney, Folha, Agência Brasil, Brazil Journal) + buscas do Google News restritas por `site:` aos veículos sem RSS público (Valor, Estadão, O Globo, Pipeline, Bloomberg, FT, Reuters, imprensa setorial de energia). |
| `lib/classify.js` | **Filtro "Brasil primeiro"**: Política, Economia, Bolsa, Capitais & Dívida e Utilities só aceitam notícias do Brasil (notícia sobre outro país sem ligação com o Brasil é descartada); Bolsa e Capitais exigem marcador explícito de Brasil (Ibovespa, B3, ticker, empresa brasileira, R$, Tesouro, CVM...). A aba Internacional só recebe fatores externos de impacto direto (Fed, Treasuries, petróleo, minério, economia chinesa, guerra comercial, BCE). Loterias e finanças pessoais genéricas são descartadas. |
| `lib/aggregate.js` | Baixa tudo em paralelo, filtra pela whitelist, remove duplicadas, ordena por horário. Cache de 5 min. |
| `api/news.js` | `GET /api/news?cat=utilities&hours=48` → JSON com as notícias. |
| `api/status.js` | `GET /api/status` → mostra quais feeds responderam e quantas notícias trouxeram. **Olhe isso depois do primeiro deploy.** |
| `api/briefing.js` | Resumo do dia por IA (opcional). |
| `public/` | Interface: abas, busca (aceita ticker, ex.: `SBSP3`), filtro por fonte e período, tema claro/escuro, atualização automática a cada 10 min. |

## Observações importantes

- **Veículos com paywall e sem RSS** (Valor, Estadão, Bloomberg, FT) entram via Google News: aparecem com título, fonte e horário, mas **sem resumo**, e o link passa por um redirecionamento do Google News antes de abrir a matéria no site do veículo.
- Se algum RSS mudar de endereço, ele aparece como falha em `/api/status` e o painel continua funcionando com os demais. Basta corrigir a URL em `lib/feeds.js`.
- Os resumos exibidos nos cards são o texto que o próprio veículo distribui no feed; o painel não reproduz o conteúdo das matérias.
