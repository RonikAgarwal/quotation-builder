// Diagnostic script: tests the hybrid search against all failing queries.
// Run with: node --experimental-vm-modules src/data/test-search.mjs

import { readFileSync } from 'fs';

// --- Inline the normalize functions (since we can't import TS directly) ---
const FRACTIONS = {
  '1¼': '1 1/4', '1½': '1 1/2', '2½': '2 1/2', '3½': '3 1/2',
  '½': '1/2', '¼': '1/4', '¾': '3/4',
};

function expandFractions(input) {
  let s = input;
  for (const [glyph, repl] of Object.entries(FRACTIONS)) {
    s = s.replace(new RegExp(glyph, 'g'), ` ${repl} `);
  }
  return s;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(input) {
  return expandFractions(input)
    .toLowerCase()
    .replace(/[•]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/(\d+)(x)(\d)/g, '$1⊗$3')
    .replace(/(\d)([a-z])/g, '$1 $2')
    .replace(/([a-z])(\d)/g, '$1 $2')
    .replace(/⊗/g, 'x')
    .replace(/[()"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text) {
  return [...new Set(text.split(/\s+/).filter(t => t.length > 0))];
}

function tokenMatchesText(token, text) {
  try {
    const escaped = escapeRegex(token);
    return new RegExp('(?:^|\\b)' + escaped + '(?:\\b|$)').test(text);
  } catch {
    return text.includes(token);
  }
}

function normalizeSize(size) {
  if (!size) return '';
  const rawLower = size.toLowerCase();
  const s = normalizeText(size);
  const tokens = [];
  const axbRaw = rawLower.match(/(\d[\d.]*)x(\d[\d.]*)/);
  if (axbRaw) tokens.push(`${axbRaw[1]}x${axbRaw[2]}`, axbRaw[1], axbRaw[2]);
  const inchMatch = s.match(/([0-9/ ]+?)\s*inch/);
  if (inchMatch) tokens.push(inchMatch[1].trim());
  const mmMatch = s.match(/(\d+)\s*mm/);
  if (mmMatch) tokens.push(mmMatch[1], `${mmMatch[1]}mm`);
  if (tokens.length === 0) tokens.push(s);
  return [...new Set(tokens)].join(' ');
}

function normalizeVariant(variant) {
  if (!variant || variant.toLowerCase() === 'standard') return '';
  const base = normalizeText(variant);
  const glued = base.replace(/([a-z]+)\s+(\d+)/g, '$1$2');
  return glued === base ? base : `${base} ${glued}`;
}

function normalizePressure(pressure) {
  if (!pressure) return '';
  const num = pressure.match(/([\d.]+)/);
  if (!num) return '';
  return `${num[1]}kg ${num[1]} kg`;
}

function buildSearchableText(name, category, variant, size, pressure, sizeKey, variantKey, pressureKey) {
  const parts = [
    normalizeText(name),
    category ? normalizeText(category) : '',
    variant && variant.toLowerCase() !== 'standard' ? normalizeText(variant) : '',
    size ? normalizeText(size) : '',
    pressure ? normalizeText(pressure) : '',
    sizeKey, variantKey, pressureKey,
  ];
  return parts.filter(p => p.trim()).join(' ');
}

// --- Load catalog ---
const raw = JSON.parse(readFileSync('public/master_catalog_production.json', 'utf8'));
const avail = raw.filter(r => r.attributes.is_available);

const products = avail.map((rec, i) => {
  const a = rec.attributes;
  const sizeKey = normalizeSize(a.size);
  const variantKey = normalizeVariant(a.variant);
  const pressureKey = normalizePressure(a.pressure);
  return {
    id: `p-${i}`,
    productName: rec.product_name,
    category: a.category,
    variant: a.variant,
    size: a.size,
    searchText: buildSearchableText(rec.product_name, a.category, a.variant, a.size, a.pressure, sizeKey, variantKey, pressureKey),
  };
});

// --- Hybrid search (Stage 1 only — exact token matching) ---
function search(query, limit = 10) {
  const normalized = normalizeText(query);
  const tokens = tokenize(normalized);
  if (tokens.length === 0) return [];

  const tokenRegexes = tokens.map(t => {
    try {
      return new RegExp('(?:^|\\b)' + escapeRegex(t) + '(?:\\b|$)');
    } catch { return null; }
  });

  const scored = [];
  for (const product of products) {
    let exactHits = 0;
    let nameHits = 0;
    const normalizedName = normalizeText(product.productName);

    for (let i = 0; i < tokens.length; i++) {
      const regex = tokenRegexes[i];
      const matched = regex ? regex.test(product.searchText) : product.searchText.includes(tokens[i]);
      if (matched) {
        exactHits++;
        if (regex ? regex.test(normalizedName) : normalizedName.includes(tokens[i])) nameHits++;
      }
    }

    if (exactHits > 0) {
      const exactScore = exactHits / tokens.length;
      const nameBonus = nameHits / tokens.length;
      const finalScore = exactScore * 0.55 + nameBonus * 0.15;
      scored.push({ product, finalScore, exactHits });
    }
  }

  scored.sort((a, b) => {
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
    if (b.exactHits !== a.exactHits) return b.exactHits - a.exactHits;
    return a.product.productName.localeCompare(b.product.productName);
  });

  return scored.slice(0, limit);
}

// --- Test queries ---
const queries = [
  { q: 'elbow 3/4', expect: 'Elbow products with ¾ inch size' },
  { q: '3/4 elbow cpvc', expect: 'CPVC Elbow ¾ inch at top' },
  { q: 'cpvc pipe 3/4', expect: 'CPVC Pipe ¾ inch variants' },
  { q: 'quickfit 63', expect: 'QUICKFIT PIPES with 63mm' },
  { q: '63 quickfit', expect: 'Same as above (order independence)' },
  { q: 'pipe sdr11', expect: 'CPVC Pipe SDR 11 variants' },
  { q: '3/4 cpvc pipe', expect: 'CPVC Pipe ¾ inch' },
  { q: 'cpvc pipe 3/4', expect: 'CPVC Pipe ¾ inch' },
  { q: 'pipe cpvc 3/4', expect: 'CPVC Pipe ¾ inch' },
  { q: '3/4 pipe cpvc', expect: 'CPVC Pipe ¾ inch' },
  { q: '25 pipe', expect: 'Pipes with 25mm' },
  { q: 'plain pipe 25', expect: 'PLAIN PIPES with 25mm' },
  { q: '25 plain pipe', expect: 'PLAIN PIPES with 25mm' },
  { q: 'cpvc elbow', expect: 'CPVC Elbow products' },
  { q: '4 swr ptee', expect: 'SWR Plain Tee 110mm' },
  { q: '110 door bend', expect: 'Door Bend 110mm' },
  { q: 'tank nipple 1 inch', expect: 'Tank/Nipple 1 inch products' },
  { q: 'nahani trap', expect: 'NAHANI TRAP products' },
];

console.log('=== Hybrid Search Diagnostic ===\n');
let passed = 0;
let failed = 0;

for (const { q, expect } of queries) {
  const normalized = normalizeText(q);
  const tokens = tokenize(normalized);
  const results = search(q, 5);

  const status = results.length > 0 ? '✅' : '❌';
  if (results.length > 0) passed++; else failed++;

  console.log(`${status} Query: "${q}" → tokens: [${tokens.join(', ')}]`);
  console.log(`   Expected: ${expect}`);
  console.log(`   Results: ${results.length}`);
  results.forEach((r, i) => {
    console.log(`     ${i + 1}. [score:${r.finalScore.toFixed(3)}, hits:${r.exactHits}/${tokens.length}] ${r.product.productName} | ${r.product.category || ''} | ${r.product.variant || ''} | ${r.product.size || ''}`);
  });
  console.log('');
}

console.log(`\n=== Summary: ${passed} passed, ${failed} failed out of ${queries.length} ===`);
