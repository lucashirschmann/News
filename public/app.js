const TABS = [
  { id: 'destaques', label: 'Destaques' },
  { id: 'politica', label: 'Política' },
  { id: 'economia', label: 'Economia' },
  { id: 'bolsa', label: 'Bolsa' },
  { id: 'capitais', label: 'Capitais & Dívida' },
  { id: 'utilities', label: 'Utilities' },
  { id: 'global', label: 'Internacional' },
];
const CAT_LABEL = Object.fromEntries(TABS.map((t) => [t.id, t.label]));
const SUBS = [['', 'Todas'], ['energia', 'Energia'], ['saneamento', 'Saneamento'], ['residuos', 'Resíduos e aterros']];
const REFRESH_MS = 10 * 60 * 1000;

const $ = (s) => document.querySelector(s);
const state = { tab: 'destaques', items: [], updatedAt: null, q: '', source: '', hours: 48, sub: '', briefings: {}, loading: true, error: null };

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const safeUrl = (u) => (/^https?:\/\//i.test(u) ? u : '#');

function timeAgo(iso) {
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ontem' : `há ${d} dias`;
}
const fmtFull = (iso) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

/* ---------- Tema ---------- */
function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem('rb-theme'); } catch {}
  if (saved) document.documentElement.dataset.theme = saved;
  $('#theme').addEventListener('click', () => {
    const cur = document.documentElement.dataset.theme
      || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('rb-theme', next); } catch {}
  });
}

/* ---------- Dados ---------- */
async function load() {
  const btn = $('#refresh');
  btn.disabled = true;
  try {
    const r = await fetch('/api/news?hours=72');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    state.items = data.items || [];
    state.updatedAt = data.updatedAt;
    state.error = null;
  } catch (e) {
    state.error = 'Não foi possível carregar as notícias agora. Tente atualizar em instantes.';
  } finally {
    state.loading = false;
    btn.disabled = false;
    fillSources();
    render();
    loadBriefing(state.tab);
  }
}

async function loadBriefing(tab) {
  const cat = tab === 'destaques' ? 'all' : tab;
  if (state.briefings[cat]) return renderBriefing();
  try {
    const r = await fetch('/api/briefing?cat=' + cat);
    state.briefings[cat] = await r.json();
  } catch {
    state.briefings[cat] = { enabled: false };
  }
  renderBriefing();
}

function fillSources() {
  const sel = $('#source');
  const counts = {};
  state.items.forEach((it) => { counts[it.source] = (counts[it.source] || 0) + 1; });
  const cur = sel.value;
  sel.innerHTML = '<option value="">Todas as fontes</option>' + Object.keys(counts).sort((a, b) => a.localeCompare(b, 'pt'))
    .map((s) => `<option value="${esc(s)}">${esc(s)} (${counts[s]})</option>`).join('');
  sel.value = counts[cur] ? cur : '';
}

function filtered(cat, { ignoreSub = false } = {}) {
  const since = Date.now() - state.hours * 3600e3;
  const q = norm(state.q.trim());
  return state.items.filter((it) =>
    (cat === 'all' || it.cats.includes(cat))
    && new Date(it.publishedAt).getTime() >= since
    && (!state.source || it.source === state.source)
    && (ignoreSub || cat !== 'utilities' || !state.sub || it.sub === state.sub)
    && (!q || norm(`${it.title} ${it.summary} ${it.source} ${(it.tickers || []).join(' ')}`).includes(q)));
}

/* ---------- Render ---------- */
function renderTabs() {
  $('#tabs').innerHTML = TABS.map((t) => {
    const n = t.id === 'destaques' ? '' : `<span class="n">${filtered(t.id).length}</span>`;
    return `<button class="tab" role="tab" data-tab="${t.id}" aria-selected="${state.tab === t.id}" style="--tc: var(--c-${t.id})">${t.label}${n}</button>`;
  }).join('');
}

function card(it, showCat = false) {
  const link = esc(safeUrl(it.link));
  const mainCat = it.cats.find((c) => CAT_LABEL[c]) || '';
  return `<article class="card">
    <div class="card-meta">
      <span class="src">${esc(it.source)}</span>
      <time class="dotsep" datetime="${esc(it.publishedAt)}" title="${esc(fmtFull(it.publishedAt))}">${timeAgo(it.publishedAt)}</time>
      ${showCat && mainCat ? `<span class="cat-tag dotsep" style="--tc: var(--c-${mainCat})">${esc(CAT_LABEL[mainCat])}</span>` : ''}
    </div>
    <h3><a href="${link}" target="_blank" rel="noopener noreferrer">${esc(it.title)}</a></h3>
    ${it.summary ? `<p>${esc(it.summary)}</p>` : ''}
    <div class="card-foot">
      ${(it.tickers || []).map((t) => `<button class="ticker" type="button" data-q="${esc(t)}" title="Filtrar por ${esc(t)}">${esc(t)}</button>`).join('')}
      <a class="read" href="${link}" target="_blank" rel="noopener noreferrer">Ler na fonte ↗</a>
    </div>
  </article>`;
}

function renderSubchips() {
  const box = $('#subchips');
  box.hidden = state.tab !== 'utilities';
  if (box.hidden) return;
  const base = filtered('utilities', { ignoreSub: true });
  box.innerHTML = SUBS.map(([id, label]) => {
    const n = id ? base.filter((it) => it.sub === id).length : base.length;
    return `<button class="chip" type="button" data-sub="${id}" aria-pressed="${state.sub === id}">${label} · ${n}</button>`;
  }).join('');
}

function renderBriefing() {
  const box = $('#briefing');
  const b = state.briefings[state.tab === 'destaques' ? 'all' : state.tab];
  if (!b || !b.enabled || (!b.bullets?.length && !b.note)) { box.hidden = true; return; }
  const title = state.tab === 'destaques' ? 'Resumo do dia' : `Resumo do dia · ${CAT_LABEL[state.tab]}`;
  const when = b.generatedAt ? `gerado por IA a partir das manchetes · ${fmtFull(b.generatedAt)}` : '';
  box.innerHTML = `<h2>${esc(title)} <span>${esc(when)}</span></h2>` + (b.bullets?.length
    ? `<ul>${b.bullets.map((x) => `<li>${esc(x.text)}${x.refs?.length ? ` <span class="refs">(${x.refs.map((r) => `<a href="${esc(safeUrl(r.link))}" target="_blank" rel="noopener noreferrer" title="${esc(r.title)}">${esc(r.source)}</a>`).join(', ')})</span>` : ''}</li>`).join('')}</ul>`
    : `<p class="note">${esc(b.note)}</p>`);
  box.hidden = false;
}

function render() {
  renderTabs();
  renderSubchips();
  $('#updated').textContent = state.updatedAt ? `Atualizado ${timeAgo(state.updatedAt)} · ${new Date(state.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : '';
  const c = $('#content');

  if (state.loading) { c.innerHTML = `<div class="grid three">${'<div class="skeleton"></div>'.repeat(6)}</div>`; return; }
  if (state.error) { c.innerHTML = `<div class="error">${esc(state.error)}</div>`; return; }

  if (state.tab === 'destaques') {
    const filtering = state.q || state.source;
    if (filtering) {
      const list = filtered('all');
      c.innerHTML = list.length ? `<div class="grid three">${list.slice(0, 60).map((it) => card(it, true)).join('')}</div>` : empty();
      return;
    }
    c.innerHTML = TABS.slice(1).map((t) => {
      const list = filtered(t.id).slice(0, 6);
      if (!list.length) return '';
      return `<section class="section" style="--sc: var(--c-${t.id})">
        <div class="section-head"><h2>${t.label}</h2><a href="#${t.id}">Ver tudo →</a></div>
        <div class="grid three">${list.map((it) => card(it)).join('')}</div>
      </section>`;
    }).join('') || empty();
    return;
  }

  const list = filtered(state.tab);
  c.innerHTML = list.length ? `<div class="grid">${list.map((it) => card(it)).join('')}</div>` : empty();
}

const empty = () => '<div class="empty">Nenhuma notícia encontrada para esse filtro e período.</div>';

/* ---------- Eventos ---------- */
function setTab(id) {
  if (!CAT_LABEL[id]) id = 'destaques';
  state.tab = id;
  if (location.hash.slice(1) !== id) history.replaceState(null, '', '#' + id);
  render();
  renderBriefing();
  loadBriefing(id);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

$('#tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) setTab(b.dataset.tab); });
window.addEventListener('hashchange', () => setTab(location.hash.slice(1)));
$('#subchips').addEventListener('click', (e) => { const b = e.target.closest('[data-sub]'); if (b) { state.sub = b.dataset.sub; render(); } });
$('#content').addEventListener('click', (e) => {
  const t = e.target.closest('[data-q]');
  if (t) { state.q = t.dataset.q; $('#q').value = state.q; render(); }
});
let deb;
$('#q').addEventListener('input', (e) => { clearTimeout(deb); deb = setTimeout(() => { state.q = e.target.value; render(); }, 150); });
$('#source').addEventListener('change', (e) => { state.source = e.target.value; render(); });
$('#hours').addEventListener('change', (e) => { state.hours = Number(e.target.value); render(); });
$('#refresh').addEventListener('click', () => { state.briefings = {}; load(); });

initTheme();
state.tab = CAT_LABEL[location.hash.slice(1)] ? location.hash.slice(1) : 'destaques';
render();
load();
setInterval(load, REFRESH_MS);
setInterval(() => { if (!state.loading) $('#updated').textContent = state.updatedAt ? `Atualizado ${timeAgo(state.updatedAt)}` : ''; }, 60000);
