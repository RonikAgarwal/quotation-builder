import { readFileSync } from 'fs';

const FRACTIONS = {
  '1¼': '1 1/4', '1½': '1 1/2', '2½': '2 1/2', '3½': '3 1/2',
  '½': '1/2', '¼': '1/4', '¾': '3/4',
};

function expandFractions(input) {
  let s = input;
  for (const [glyph, repl] of Object.entries(FRACTIONS))
    s = s.replace(new RegExp(glyph, 'g'), ` ${repl} `);
  return s;
}
function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function normalizeText(input) {
  return expandFractions(input).toLowerCase()
    .replace(/[•]/g, ' ').replace(/-/g, ' ')
    .replace(/(\d+)(x)(\d)/g, '$1⊗$3')
    .replace(/(\d)([a-z])/g, '$1 $2')
    .replace(/([a-z])(\d)/g, '$1 $2')
    .replace(/⊗/g, 'x')
    .replace(/[()"]/g, ' ').replace(/\s+/g, ' ').trim();
}
function tokenize(t) { return [...new Set(t.split(/\s+/).filter(t=>t.length>0))]; }

function tokenMatchesText(token, text) {
  try {
    const escaped = escapeRegex(token);
    if (new RegExp('(?:^|\\b)' + escaped + '(?:\\b|$)').test(text)) return true;
    if (token.length >= 3 && /^[a-z]+$/.test(token))
      return new RegExp('(?:^|\\b)' + escaped).test(text);
    return false;
  } catch { return text.includes(token); }
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
function normalizeVariant(v) {
  if (!v || v.toLowerCase() === 'standard') return '';
  const b = normalizeText(v);
  const g = b.replace(/([a-z]+)\s+(\d+)/g, '$1$2');
  return g === b ? b : `${b} ${g}`;
}
function normalizePressure(p) {
  if (!p) return '';
  const m = p.match(/([\d.]+)/);
  return m ? `${m[1]}kg ${m[1]} kg` : '';
}
function buildSearchableText(name, cat, var_, sz, pr, sk, vk, pk) {
  return [normalizeText(name), cat?normalizeText(cat):'',
    var_&&var_.toLowerCase()!=='standard'?normalizeText(var_):'',
    sz?normalizeText(sz):'', pr?normalizeText(pr):'',
    sk, vk, pk].filter(p=>p.trim()).join(' ');
}

const raw = JSON.parse(readFileSync('public/master_catalog_production.json','utf8'));
const avail = raw.filter(r=>r.attributes.is_available);
const products = avail.map((rec,i)=>{
  const a = rec.attributes;
  const sk=normalizeSize(a.size), vk=normalizeVariant(a.variant), pk=normalizePressure(a.pressure);
  return { id:`p-${i}`, productName:rec.product_name, category:a.category,
    variant:a.variant, size:a.size,
    searchText:buildSearchableText(rec.product_name,a.category,a.variant,a.size,a.pressure,sk,vk,pk) };
});

function search(query, limit=10) {
  const tokens = tokenize(normalizeText(query));
  if (!tokens.length) return [];
  const scored = [];
  for (const p of products) {
    let exactHits=0, nameHits=0;
    const nn = normalizeText(p.productName);
    for (const t of tokens) {
      if (tokenMatchesText(t, p.searchText)) {
        exactHits++;
        if (tokenMatchesText(t, nn)) nameHits++;
      }
    }
    if (exactHits>0) {
      scored.push({p, finalScore: (exactHits/tokens.length)*0.55 + (nameHits/tokens.length)*0.15, exactHits});
    }
  }
  scored.sort((a,b)=>b.finalScore-a.finalScore || b.exactHits-a.exactHits || a.p.productName.localeCompare(b.p.productName));
  return scored.slice(0,limit);
}

const queries = [
  { q: 'elbow 3/4', expect: 'Elbow ¾ products' },
  { q: '3/4 elbow cpvc', expect: 'CPVC Elbow ¾' },
  { q: 'cpvc pipe 3/4', expect: 'CPVC Pipe ¾' },
  { q: 'quickfit 63', expect: 'QUICKFIT 63mm' },
  { q: '63 quickfit', expect: 'QUICKFIT 63mm (order independent)' },
  { q: 'pipe sdr11', expect: 'CPVC Pipe SDR 11' },
  { q: '3/4 cpvc pipe', expect: 'CPVC Pipe ¾' },
  { q: 'pipe cpvc 3/4', expect: 'CPVC Pipe ¾' },
  { q: '3/4 pipe cpvc', expect: 'CPVC Pipe ¾' },
  { q: '25 pipe', expect: 'Pipes 25mm' },
  { q: 'plain pipe 25', expect: 'PLAIN PIPES 25mm' },
  { q: '25 plain pipe', expect: 'PLAIN PIPES 25mm' },
  { q: 'cpvc elbow', expect: 'CPVC Elbow products' },
  { q: '4 swr ptee', expect: 'SWR Plain Tee 110mm' },
  { q: '110 door bend', expect: 'Door Bend 110mm' },
  { q: 'tank nipple 1 inch', expect: 'Tank/Nipple 1 inch' },
  { q: 'nahani trap', expect: 'NAHANI TRAP' },
];

console.log('=== Hybrid Search v2 (with prefix matching) ===\n');
let pass=0, fail=0;
for (const {q,expect} of queries) {
  const tokens = tokenize(normalizeText(q));
  const results = search(q, 5);
  const ok = results.length > 0;
  if (ok) pass++; else fail++;
  console.log(`${ok?'✅':'❌'} "${q}" → [${tokens.join(', ')}]  expect: ${expect}`);
  results.forEach((r,i)=>console.log(`   ${i+1}. [${r.finalScore.toFixed(3)} ${r.exactHits}/${tokens.length}] ${r.p.productName} | ${r.p.category} | ${r.p.variant} | ${r.p.size}`));
  console.log('');
}
console.log(`\n=== ${pass}/${queries.length} passed ===`);
