#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SITE_DATA = resolve(ROOT, 'site/data');
const TOOLKIT_DIR = resolve(ROOT, 'skills/21-toolkit');

// Maps each toolkit skill to one of the existing catalog categories.
const TOOLKIT_CATEGORY_MAP = {
  'ai-startup-advisor': 'business-tools',
  'app-onboarding-questionnaire': 'design',
  apple: 'productivity',
  applescript: 'productivity',
  'claude-docs-skill': 'skill-enhancers',
  deepwiki: 'productivity',
  'design-md': 'design',
  'fusion360-scripting': 'productivity',
  'gemini-docs-skill': 'ai-ml',
  'hooks-mastery': 'skill-enhancers',
  'install-and-maintain': 'skill-enhancers',
  'install-toolkit-skills': 'skill-enhancers',
  'marketplace-manager': 'skill-enhancers',
  'openrouter-docs-skill': 'ai-ml',
  'perplexity-search': 'mcp',
  'project-bootstrapper': 'skill-enhancers',
  'skill-manager': 'skill-enhancers',
  'version-manager': 'devops',
  'warp-docs-skill': 'productivity',
  'webapp-testing': 'testing',
};

if (!existsSync(SITE_DATA)) mkdirSync(SITE_DATA, { recursive: true });

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const writeJson = (p, data) => writeFileSync(p, JSON.stringify(data, null, 2));

const marketplace = readJson(resolve(ROOT, '.claude-plugin/marketplace.json'));

const DOWNLOADS =
  '/Users/jesper/Downloads/claude-code-plugins-plus-skills-main/marketplace/src/data';
const spotlightsRaw = existsSync(`${DOWNLOADS}/spotlights.json`)
  ? readJson(`${DOWNLOADS}/spotlights.json`)
  : null;
const collectionsRaw = existsSync(`${DOWNLOADS}/collections.json`)
  ? readJson(`${DOWNLOADS}/collections.json`)
  : null;

// Normalize plugin records -> slim shape for the site
const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/^[0-9]+-/, '')
    .replace(/^jeremy-/, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const titleCase = (s) =>
  String(s || '')
    .replace(/[-_]+/g, ' ')
    .replace(/^[0-9]+-/, '')
    .replace(/^jeremy /, '')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

function readToolkitSkills() {
  if (!existsSync(TOOLKIT_DIR)) return [];
  const skills = [];
  for (const entry of readdirSync(TOOLKIT_DIR)) {
    if (entry.startsWith('_')) continue;
    const dir = join(TOOLKIT_DIR, entry);
    const skillFile = join(dir, 'SKILL.md');
    if (!existsSync(skillFile) || !statSync(skillFile).isFile()) continue;
    const raw = readFileSync(skillFile, 'utf8');
    const m = raw.match(/^---\n([\s\S]*?)\n---/);
    if (!m) continue;
    let fm;
    try {
      fm = yaml.load(m[1]) || {};
    } catch {
      continue;
    }
    const slug = fm.name || entry;
    const category = TOOLKIT_CATEGORY_MAP[slug] || 'productivity';
    skills.push({
      slug,
      name: slug,
      title: titleCase(slug),
      description: String(fm.description || '').trim(),
      version: fm.version || '1.0.0',
      category,
      keywords: Array.isArray(fm.tags) ? fm.tags : [],
      author: typeof fm.author === 'string' ? fm.author.replace(/<.*>/, '').trim() : '',
      license: fm.license || 'MIT',
      repository: null,
      sourcePath: `./skills/21-toolkit/${entry}`,
      installCommand: `ccpi skills install ${slug} --surface project`,
      type: 'skill',
    });
  }
  return skills;
}

const plugins = (marketplace.plugins || []).map((p) => {
  const slug = slugify(p.name);
  const repoUrl = typeof p.repository === 'string' ? p.repository : p.repository?.url || null;
  return {
    slug,
    name: p.name,
    title: titleCase(p.name),
    description: p.description || '',
    version: p.version || '1.0.0',
    category: p.category || 'uncategorized',
    keywords: Array.isArray(p.keywords) ? p.keywords : [],
    author: typeof p.author === 'object' ? p.author?.name || '' : p.author || '',
    license: p.license || '',
    repository: repoUrl,
    sourcePath: p.source || null,
    installCommand: `/plugin install ${p.name}`,
    type: 'plugin',
  };
});

const toolkitSkills = readToolkitSkills();
const allEntries = [...plugins, ...toolkitSkills];

// Build category counts (plugins + skills)
const categoryCounts = {};
for (const p of allEntries) {
  categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
}

const categories = Object.entries(categoryCounts)
  .sort(([, a], [, b]) => b - a)
  .map(([id, count]) => ({ id, label: titleCase(id), count }));

const catalog = {
  meta: {
    generated: new Date().toISOString(),
    totalPlugins: plugins.length,
    totalSkills: toolkitSkills.length,
    totalEntries: allEntries.length,
    totalCategories: categories.length,
  },
  categories,
  plugins: allEntries,
};

writeJson(resolve(SITE_DATA, 'catalog.json'), catalog);

// Spotlight: rebrand and clean links
const cleanLink = (link) => {
  if (!link) return null;
  if (link.startsWith('http')) return link;
  // Strip /plugins/<slug> paths that point at tonsofskills.com
  if (link.startsWith('/plugins/')) return null;
  return link;
};

const enrichSpotlight = (entry) => {
  const slug = entry.pluginSlug;
  const match = plugins.find((p) => p.slug === slug || p.name === slug);
  return {
    week: entry.week,
    slug,
    title: match?.title || titleCase(slug),
    headline: entry.headline || '',
    summary: entry.whyKiller || '',
    quote: entry.quote || null,
    author: entry.author || match?.author || null,
    authorGithub: entry.authorGithub || null,
    grade: entry.grade || null,
    skillCount: entry.skillCount ?? null,
    category: entry.category || match?.category || null,
    link: cleanLink(entry.link),
    repository: match?.repository || null,
    inCatalog: Boolean(match),
  };
};

if (spotlightsRaw) {
  const spotlight = {
    meta: {
      week: spotlightsRaw.week,
      title: 'Skill Spotlight',
      tagline: 'A community-curated pick — refreshed weekly',
      generated: new Date().toISOString(),
    },
    current: enrichSpotlight({
      ...spotlightsRaw.spotlight,
      week: spotlightsRaw.week,
    }),
    previous: (spotlightsRaw.hallOfFame || []).map(enrichSpotlight),
  };
  writeJson(resolve(SITE_DATA, 'spotlights.json'), spotlight);
}

if (collectionsRaw) {
  // Resolve bundle slugs against the real catalog. Collections in the upstream
  // file reference some plugins that aren't shipped here; filter to matches.
  const slugIndex = new Map();
  for (const p of plugins) {
    slugIndex.set(p.slug, p);
    slugIndex.set(p.name, p);
  }
  const collections = (collectionsRaw.collections || [])
    .map((c) => {
      const matched = (c.plugins || [])
        .map((slug) => slugIndex.get(slug))
        .filter(Boolean)
        .map((p) => p.slug);
      return {
        id: c.id,
        name: c.name,
        description: c.description,
        icon: c.icon,
        color: c.color,
        plugins: matched,
        totalRequested: c.plugins?.length || 0,
        featured: Boolean(c.featured),
      };
    })
    .filter((c) => c.plugins.length > 0);

  // Auto-derive a few category-based bundles to fill gaps in the curated set.
  const autoBundles = [
    {
      id: 'category-saas-packs',
      name: 'SaaS Vendor Packs',
      description: 'Vendor-specific skill bundles — Vercel, Stripe, Supabase, and more.',
      icon: '◆',
      color: '#5e6ad2',
      categories: ['saas-packs'],
    },
    {
      id: 'category-ai-ml',
      name: 'AI & ML',
      description: 'Train, fine-tune, evaluate, and deploy ML models.',
      icon: '◇',
      color: '#7c5cff',
      categories: ['ai-ml', 'ai-agency'],
    },
    {
      id: 'category-devops',
      name: 'DevOps & Infrastructure',
      description: 'CI/CD, IaC, observability, and platform engineering.',
      icon: '▲',
      color: '#27a644',
      categories: ['devops'],
    },
    {
      id: 'category-security',
      name: 'Security',
      description: 'Audit, scan, and harden codebases.',
      icon: '◉',
      color: '#dc2626',
      categories: ['security'],
    },
    {
      id: 'category-api',
      name: 'API Development',
      description: 'Design, build, document, and integrate APIs.',
      icon: '◐',
      color: '#0891b2',
      categories: ['api-development'],
    },
  ];
  for (const bundle of autoBundles) {
    const matched = plugins
      .filter((p) => bundle.categories.includes(p.category))
      .slice(0, 8)
      .map((p) => p.slug);
    if (matched.length === 0) continue;
    if (collections.some((c) => c.id === bundle.id)) continue;
    collections.push({
      id: bundle.id,
      name: bundle.name,
      description: bundle.description,
      icon: bundle.icon,
      color: bundle.color,
      plugins: matched,
      totalRequested: matched.length,
      featured: false,
    });
  }

  writeJson(resolve(SITE_DATA, 'collections.json'), { collections });
}

// Also emit a data.js bundle so the site works from file:// (Chrome blocks
// fetch() on file:// URLs but allows <script src>).
const spotlightOut = spotlightsRaw ? readJson(resolve(SITE_DATA, 'spotlights.json')) : null;
const collectionsOut = collectionsRaw ? readJson(resolve(SITE_DATA, 'collections.json')) : null;

const dataJs = `// Auto-generated by scripts/build-site.mjs — do not edit.
window.__SKILL_FORGE__ = ${JSON.stringify(
  {
    catalog,
    spotlights: spotlightOut,
    collections: collectionsOut,
  },
  null,
  0,
)};
`;
writeFileSync(resolve(SITE_DATA, 'data.js'), dataJs);

const sizes = {
  catalog: plugins.length,
  skills: toolkitSkills.length,
  categories: categories.length,
  spotlight: spotlightsRaw ? 1 + (spotlightsRaw.hallOfFame?.length || 0) : 0,
  collections: collectionsRaw?.collections?.length || 0,
};

console.log('built site/data/');
console.log(
  `  catalog.json      ${sizes.catalog} plugins + ${sizes.skills} toolkit skills, ${sizes.categories} categories`,
);
if (sizes.spotlight) console.log(`  spotlights.json   ${sizes.spotlight} entries`);
if (sizes.collections) console.log(`  collections.json  ${sizes.collections} collections`);
console.log(`  data.js           bundled for file:// loading`);
