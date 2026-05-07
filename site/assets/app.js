// Skill Forge — client-side catalog, suggester, and detail viewer.
// No build step, no dependencies. Runs from file://.

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const STOP = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'but',
  'i',
  'we',
  'you',
  'they',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'to',
  'of',
  'in',
  'on',
  'for',
  'with',
  'at',
  'from',
  'by',
  'as',
  'this',
  'that',
  'these',
  'those',
  'it',
  'its',
  'my',
  'me',
  'our',
  'how',
  'what',
  'which',
  'when',
  'where',
  'why',
  'can',
  'could',
  'should',
  'would',
  'will',
  'shall',
  'may',
  'might',
  'just',
  'into',
  'about',
  'over',
  'some',
  'any',
  'one',
  'app',
  'apps',
  'tool',
  'tools',
  'thing',
  'something',
]);

const tokenize = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s.+#-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOP.has(t));

// Singularize crude — drop trailing 's' on tokens of len ≥ 4 to merge plurals.
const stem = (t) =>
  t.length >= 5 && t.endsWith('ies')
    ? t.slice(0, -3) + 'y'
    : t.length >= 4 && t.endsWith('s') && !t.endsWith('ss')
      ? t.slice(0, -1)
      : t;

const PAGE_SIZE = 24;

const state = {
  catalog: null,
  spotlights: null,
  collections: null,
  index: [], // [{plugin, fields:{name,desc,kw,cat}}]
  filter: { cat: null, q: '', slugs: null, label: null },
  shown: PAGE_SIZE,
};

async function loadJson(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(`failed to load ${path}: ${r.status}`);
  return r.json();
}

async function loadData() {
  // Prefer the inlined bundle (works from file:// where fetch is blocked).
  if (window.__SKILL_FORGE__) {
    const d = window.__SKILL_FORGE__;
    return [d.catalog, d.spotlights, d.collections];
  }
  return Promise.all([
    loadJson('data/catalog.json'),
    loadJson('data/spotlights.json').catch(() => null),
    loadJson('data/collections.json').catch(() => null),
  ]);
}

async function init() {
  try {
    const [catalog, spotlights, collections] = await loadData();
    state.catalog = catalog;
    state.spotlights = spotlights;
    state.collections = collections;
    state.index = buildIndex(catalog.plugins);

    renderStats();
    renderSpotlight();
    renderFacets();
    renderCatalog();
    renderCollections();
    renderHallOfFame();
    bindUi();
  } catch (err) {
    console.error('Skill Forge init failed:', err);
    document.body.innerHTML = `<main style="padding:48px;color:#f7f8f8;font-family:Inter,system-ui">
      <h1>Failed to load catalog</h1>
      <p>Run <code>pnpm site:build</code> first, then reload this page.</p>
      <pre style="color:#8a8f98">${String(err)}</pre>
    </main>`;
  }
}

function buildIndex(plugins) {
  return plugins.map((p) => {
    const nameTokens = tokenize(p.title + ' ' + p.name).map(stem);
    const descTokens = tokenize(p.description).map(stem);
    const kwTokens = (p.keywords || []).flatMap((k) => tokenize(k)).map(stem);
    const catTokens = tokenize(p.category).map(stem);
    return {
      plugin: p,
      tf: tokenFreq([...nameTokens, ...descTokens, ...kwTokens, ...catTokens]),
      nameSet: new Set(nameTokens),
      descSet: new Set(descTokens),
      kwSet: new Set(kwTokens),
      catSet: new Set(catTokens),
    };
  });
}

function tokenFreq(arr) {
  const m = new Map();
  for (const t of arr) m.set(t, (m.get(t) || 0) + 1);
  return m;
}

// Field-weighted scoring: name 4× · keywords 3× · category 2× · description 1×.
// Adds a small bonus per distinct matched token (coverage signal).
function scoreEntry(entry, queryTokens) {
  if (queryTokens.length === 0) return 0;
  let score = 0;
  let matched = 0;
  for (const q of queryTokens) {
    let hit = 0;
    if (entry.nameSet.has(q)) hit += 4;
    if (entry.kwSet.has(q)) hit += 3;
    if (entry.catSet.has(q)) hit += 2;
    if (entry.descSet.has(q)) hit += 1;
    // partial token (prefix) match — handles "deploy" matching "deployment"
    if (hit === 0) {
      for (const t of entry.tf.keys()) {
        if (t.startsWith(q) && q.length >= 3) {
          hit += 0.6;
          break;
        }
      }
    }
    if (hit > 0) matched += 1;
    score += hit;
  }
  if (matched === 0) return 0;
  // coverage bonus
  score += matched * 0.5;
  // tiny length penalty so terse plugins win ties
  score -= Math.min(0.5, entry.plugin.description.length / 4000);
  return score;
}

function suggest(query, limit = 8) {
  const tokens = Array.from(new Set(tokenize(query).map(stem)));
  if (tokens.length === 0) return [];
  const ranked = [];
  for (const e of state.index) {
    const s = scoreEntry(e, tokens);
    if (s > 0) ranked.push({ e, s });
  }
  ranked.sort((a, b) => b.s - a.s);
  return ranked.slice(0, limit).map(({ e, s }) => ({
    plugin: e.plugin,
    score: s,
    matched: tokens.filter(
      (t) => e.nameSet.has(t) || e.descSet.has(t) || e.kwSet.has(t) || e.catSet.has(t),
    ),
  }));
}

function highlight(text, tokens) {
  if (!tokens || tokens.length === 0) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const stems = tokens.map(stem).filter(Boolean);
  if (stems.length === 0) return escaped;
  const re = new RegExp(`\\b(${stems.map(escapeRegex).join('|')})[a-z0-9]*`, 'gi');
  return escaped.replace(re, (m) => `<mark>${m}</mark>`);
}

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function renderStats() {
  const { totalPlugins, totalSkills, totalEntries, totalCategories, generated } =
    state.catalog.meta;
  const total = totalEntries ?? totalPlugins;
  $$('[data-stat="plugins"]').forEach((el) => (el.textContent = total));
  $$('[data-stat="skills"]').forEach((el) => (el.textContent = totalSkills ?? 0));
  $$('[data-stat="categories"]').forEach((el) => (el.textContent = totalCategories));
  const gen = generated ? new Date(generated) : new Date();
  $$('[data-stat="generated"]').forEach(
    (el) =>
      (el.textContent = `built ${gen.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })}`),
  );
}

function renderSpotlight() {
  if (!state.spotlights?.current) return;
  const card = $('[data-spotlight-card]');
  const cur = state.spotlights.current;
  if (!card) return;
  card.hidden = false;
  $('[data-spotlight-week]').textContent = cur.week || '';
  $('[data-spotlight-title]').textContent = cur.title || cur.slug;
  $('[data-spotlight-headline]').textContent = cur.headline || '';
  $('[data-spotlight-summary]').textContent = cur.summary || '';
  $('[data-spotlight-author]').textContent = cur.author ? `by ${cur.author}` : '';
  $('[data-spotlight-category]').textContent = cur.category || '';

  const linkBtn = $('[data-spotlight-link]');
  const url = cur.link || cur.repository;
  if (url && /^https?:/.test(url)) {
    linkBtn.href = url;
    linkBtn.hidden = false;
  }

  const viewBtn = $('[data-spotlight-view]');
  if (cur.inCatalog) {
    viewBtn.addEventListener('click', () => {
      const match = state.catalog.plugins.find((p) => p.slug === cur.slug || p.name === cur.slug);
      if (match) openDetail(match);
    });
  } else {
    viewBtn.disabled = true;
    viewBtn.textContent = 'External plugin';
  }
}

function renderHallOfFame() {
  const wrap = $('[data-hall-of-fame]');
  if (!wrap || !state.spotlights?.previous?.length) return;
  wrap.innerHTML = state.spotlights.previous
    .slice(0, 8)
    .map(
      (p) => `
        <button class="card fame-card" data-slug="${escapeHtml(p.slug)}">
          <span class="fame-week">${escapeHtml(p.week || '')}</span>
          <span class="fame-title">${escapeHtml(p.title || p.slug)}</span>
          <span class="fame-headline">${escapeHtml(p.headline || '')}</span>
        </button>`,
    )
    .join('');
  $$('.fame-card', wrap).forEach((card) => {
    card.addEventListener('click', () => {
      const slug = card.dataset.slug;
      const match = state.catalog.plugins.find((p) => p.slug === slug || p.name === slug);
      if (match) openDetail(match);
    });
  });
}

function renderFacets() {
  const wrap = $('[data-facets]');
  if (!wrap) return;
  const cats = state.catalog.categories;
  const all = state.catalog.meta.totalPlugins;
  const items = [{ id: null, label: 'All', count: all }, ...cats];
  wrap.innerHTML = items
    .map(
      (c) => `
        <button class="facet" role="tab" data-cat="${c.id ?? ''}" aria-selected="${
          c.id === state.filter.cat ? 'true' : 'false'
        }">
          <span>${escapeHtml(c.label)}</span>
          <span class="facet-count">${c.count}</span>
        </button>`,
    )
    .join('');
  $$('.facet', wrap).forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.cat || null;
      state.filter.cat = id;
      state.shown = PAGE_SIZE;
      renderFacets();
      renderCatalog();
    });
  });
}

function getFiltered() {
  let list = state.catalog.plugins;
  if (state.filter.slugs) {
    const set = state.filter.slugs;
    list = list.filter((p) => set.has(p.slug) || set.has(p.name));
  }
  if (state.filter.cat) {
    list = list.filter((p) => p.category === state.filter.cat);
  }
  const q = state.filter.q.trim().toLowerCase();
  if (q) {
    list = list.filter((p) => {
      const hay = (
        p.title +
        ' ' +
        p.name +
        ' ' +
        p.description +
        ' ' +
        (p.keywords || []).join(' ') +
        ' ' +
        (p.author || '')
      ).toLowerCase();
      return hay.includes(q);
    });
  }
  return list;
}

function applyCollection(collection) {
  state.filter.slugs = new Set(collection.plugins);
  state.filter.label = collection.name;
  state.filter.cat = null;
  state.shown = PAGE_SIZE;
  renderFacets();
  renderCatalog();
  document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function clearCollectionFilter() {
  state.filter.slugs = null;
  state.filter.label = null;
  state.shown = PAGE_SIZE;
  renderFacets();
  renderCatalog();
}

function renderCatalog() {
  const list = getFiltered();
  const grid = $('[data-grid]');
  const empty = $('[data-empty]');
  const more = $('[data-load-more]');
  const count = $('[data-result-count]');

  if (state.filter.label) {
    count.innerHTML = `${list.length} plugin${list.length === 1 ? '' : 's'} in <strong>${escapeHtml(state.filter.label)}</strong> · <button class="link-btn" data-clear-collection>clear bundle</button>`;
    const clearBtn = count.querySelector('[data-clear-collection]');
    clearBtn?.addEventListener('click', clearCollectionFilter);
  } else {
    count.textContent = `${list.length} plugin${list.length === 1 ? '' : 's'}`;
  }

  if (list.length === 0) {
    grid.innerHTML = '';
    empty.hidden = false;
    more.hidden = true;
    return;
  }
  empty.hidden = true;

  const visible = list.slice(0, state.shown);
  grid.innerHTML = visible.map(cardHtml).join('');
  $$('.card', grid).forEach((card) => {
    card.addEventListener('click', () => {
      const slug = card.dataset.slug;
      const p = state.catalog.plugins.find((x) => x.slug === slug);
      if (p) openDetail(p);
    });
  });

  more.hidden = state.shown >= list.length;
}

function cardHtml(p) {
  const kws = (p.keywords || []).slice(0, 3);
  const kwHtml = kws.map((k) => `<span class="kw-chip">${escapeHtml(k)}</span>`).join('');
  const typeBadge =
    p.type === 'skill'
      ? `<span class="status-pill type-skill" title="Toolkit skill">Skill</span>`
      : '';
  return `
    <button class="card" data-slug="${escapeHtml(p.slug)}">
      <div class="card-head">
        <span class="status-pill">${escapeHtml(p.category)}</span>
        ${typeBadge}
      </div>
      <h3 class="card-title">${escapeHtml(p.title)}</h3>
      <p class="card-desc">${escapeHtml(p.description)}</p>
      <div class="card-foot">
        ${kwHtml ? `<div class="card-keywords">${kwHtml}</div>` : ''}
      </div>
    </button>`;
}

function renderCollections() {
  const wrap = $('[data-collections]');
  if (!wrap) return;
  if (!state.collections?.collections?.length) {
    wrap.parentElement?.parentElement?.style?.setProperty('display', 'none');
    return;
  }
  wrap.innerHTML = state.collections.collections
    .map((c, i) => {
      const tags = (c.plugins || []).slice(0, 4);
      const tagHtml = tags
        .map((slug) => {
          const match = state.catalog.plugins.find((p) => p.slug === slug || p.name === slug);
          const label = match ? match.title : slug;
          return `<button type="button" class="kw-chip kw-chip-clickable" data-slug="${escapeHtml(slug)}">${escapeHtml(label)}</button>`;
        })
        .join('');
      const more = c.plugins.length > 4 ? c.plugins.length - 4 : 0;
      const icon = c.icon && c.icon.length <= 4 ? c.icon : '◆';
      return `
        <article class="collection-card" data-collection-idx="${i}" style="--accent-color:${escapeHtml(c.color || '#5e6ad2')}">
          <span class="collection-icon" aria-hidden="true">${escapeHtml(icon)}</span>
          <h3 class="collection-name">${escapeHtml(c.name)}</h3>
          <p class="collection-desc">${escapeHtml(c.description || '')}</p>
          ${tagHtml ? `<div class="collection-tags">${tagHtml}${more ? `<span class="kw-chip kw-chip-muted">+${more}</span>` : ''}</div>` : ''}
          <button type="button" class="collection-cta" data-open-collection="${i}">
            View ${c.plugins.length} plugin${c.plugins.length === 1 ? '' : 's'} →
          </button>
        </article>`;
    })
    .join('');

  $$('[data-open-collection]', wrap).forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = Number(btn.dataset.openCollection);
      const c = state.collections.collections[idx];
      if (c) applyCollection(c);
    });
  });
  $$('.kw-chip-clickable', wrap).forEach((chip) => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      const slug = chip.dataset.slug;
      const p = state.catalog.plugins.find((x) => x.slug === slug || x.name === slug);
      if (p) openDetail(p);
    });
  });
}

function bindUi() {
  // suggester
  const form = $('[data-suggest-form]');
  const input = $('#suggest-q');
  const results = $('[data-suggest-results]');

  let lastQuery = '';
  const runSuggest = () => {
    const q = input.value.trim();
    if (q === lastQuery) return;
    lastQuery = q;
    if (!q) {
      results.innerHTML = '';
      return;
    }
    const hits = suggest(q, 8);
    if (hits.length === 0) {
      results.innerHTML = `<div class="suggest-empty">No matches. Try different words — e.g. "deploy", "scrape", "monitor".</div>`;
      return;
    }
    results.innerHTML = hits.map((hit) => suggestRowHtml(hit, q)).join('');
    $$('.suggest-row', results).forEach((row) => {
      row.addEventListener('click', () => {
        const slug = row.dataset.slug;
        const p = state.catalog.plugins.find((x) => x.slug === slug);
        if (p) openDetail(p);
      });
    });
  };

  let timer = null;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(runSuggest, 80);
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearTimeout(timer);
    runSuggest();
  });

  // chips
  $$('[data-chip]').forEach((chip) => {
    chip.addEventListener('click', () => {
      input.value = chip.textContent.trim();
      input.focus();
      clearTimeout(timer);
      runSuggest();
    });
  });

  // filter
  const filterInput = $('#filter-q');
  filterInput.addEventListener('input', () => {
    state.filter.q = filterInput.value;
    state.shown = PAGE_SIZE;
    renderCatalog();
  });

  // load more
  $('[data-load-more-btn]').addEventListener('click', () => {
    state.shown += PAGE_SIZE;
    renderCatalog();
  });

  // detail close + esc
  $('[data-detail-close]').addEventListener('click', closeDetail);
  $('[data-detail]').addEventListener('click', (e) => {
    if (e.target.dataset.detail !== undefined) closeDetail();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDetail();
    // ⌘K / Ctrl-K focus prompt suggester
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      input.focus();
      input.select();
    }
  });

  // copy install
  $('[data-copy-install]').addEventListener('click', async () => {
    const text = $('[data-detail-install]').textContent;
    try {
      await navigator.clipboard.writeText(text);
      const btn = $('[data-copy-install]');
      const orig = btn.textContent;
      btn.textContent = 'Copied';
      setTimeout(() => (btn.textContent = orig), 1200);
    } catch {
      // ignore
    }
  });
}

function suggestRowHtml(hit, query) {
  const p = hit.plugin;
  const tokens = tokenize(query);
  return `
    <button class="suggest-row" data-slug="${escapeHtml(p.slug)}" type="button">
      <span class="score-pill">${hit.score.toFixed(1)}</span>
      <span class="row-body">
        <span class="row-title">${highlight(p.title, tokens)}</span>
        <span class="row-desc">${highlight(p.description, tokens)}</span>
        <span class="row-meta">
          <span class="status-pill">${escapeHtml(p.category)}</span>
          ${(p.keywords || [])
            .slice(0, 2)
            .map((k) => `<span class="kw-chip">${escapeHtml(k)}</span>`)
            .join('')}
        </span>
      </span>
      <span class="row-cta">View →</span>
    </button>`;
}

function openDetail(p) {
  const dlg = $('[data-detail]');
  const catEl = $('[data-detail-category]');
  catEl.textContent = p.type === 'skill' ? `${p.category} · skill` : p.category;
  catEl.classList.toggle('type-skill', p.type === 'skill');
  $('[data-detail-title]').textContent = p.title;
  $('[data-detail-author]').textContent = p.author || 'Unknown author';
  $('[data-detail-version]').textContent = `v${p.version}`;
  $('[data-detail-description]').textContent = p.description;
  $('[data-detail-install]').textContent = p.installCommand;

  const kwSection = $('[data-keyword-section]');
  const kwList = $('[data-detail-keywords]');
  if (p.keywords?.length) {
    kwSection.hidden = false;
    kwList.innerHTML = p.keywords
      .map((k) => `<span class="kw-chip">${escapeHtml(k)}</span>`)
      .join('');
  } else {
    kwSection.hidden = true;
  }

  const links = $('[data-detail-links]');
  const linkParts = [];
  if (p.repository) {
    linkParts.push(
      `<a class="btn btn-secondary" href="${escapeHtml(p.repository)}" target="_blank" rel="noopener noreferrer">Repository ↗</a>`,
    );
  }
  if (p.license) {
    linkParts.push(
      `<span class="btn btn-tertiary" aria-disabled="true">License: ${escapeHtml(p.license)}</span>`,
    );
  }
  links.innerHTML = linkParts.join('');

  if (typeof dlg.showModal === 'function') {
    dlg.showModal();
  } else {
    dlg.setAttribute('open', '');
  }
}

function closeDetail() {
  const dlg = $('[data-detail]');
  if (typeof dlg.close === 'function') dlg.close();
  else dlg.removeAttribute('open');
}

init();
