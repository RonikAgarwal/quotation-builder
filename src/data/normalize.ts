// Single normalization pipeline shared by BOTH catalog indexing and user
// queries. Keeping these in one place guarantees the index and the query can
// never drift: "25mm" behaves exactly like "25 mm", "¾" like "3/4",
// "sch80"/"sch-80"/"sch 80" all collapse to the same tokens.

// Common unicode fractions used in the Supreme catalog sizes.
const FRACTIONS: Record<string, string> = {
  '1¼': '1 1/4',
  '1½': '1 1/2',
  '2½': '2 1/2',
  '3½': '3 1/2',
  '½': '1/2',
  '¼': '1/4',
  '¾': '3/4',
};

// Expand unicode fractions to ascii (compounds first so "1¼" wins over "¼").
export function expandFractions(input: string): string {
  let s = input;
  for (const [glyph, repl] of Object.entries(FRACTIONS)) {
    s = s.replace(new RegExp(glyph, 'g'), ` ${repl} `);
  }
  return s;
}

// Escape special regex characters for safe use in RegExp constructor.
export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Base text normalization applied everywhere.
//  - lowercase
//  - expand unicode fractions (¾ -> 3/4)
//  - protect dimension separators (110x63 stays intact, not split into "11 0 x63")
//  - split digit→letter runs (25mm -> 25 mm)
//  - split letter→digit runs (sdr11 -> sdr 11)
//  - turn hyphens into spaces (sch-80 -> sch 80)
//  - collapse separators/whitespace
export function normalizeText(input: string): string {
  return expandFractions(input)
    .toLowerCase()
    .replace(/[•]/g, ' ')
    .replace(/-/g, ' ')                        // sch-80 -> sch 80
    .replace(/(\d+)(x)(\d)/g, '$1⊗$3')        // protect dimension "x" (110x63 -> 110⊗63)
    .replace(/(\d)([a-z])/g, '$1 $2')          // 25mm -> 25 mm
    .replace(/([a-z])(\d)/g, '$1 $2')          // sdr11 -> sdr 11
    .replace(/⊗/g, 'x')                       // restore dimension x
    .replace(/[()"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Normalize a USER QUERY. Same base pipeline as the index.
// (The old gluing logic is no longer needed — the hybrid search tokenizes the
// query and matches tokens independently across all fields.)
export function normalizeQuery(input: string): string {
  return normalizeText(input);
}

// --- Tokenizer ---------------------------------------------------------------

// Split normalized text into individual search tokens.
// Tokens like "3/4", "4x2.5" are kept intact (they're single searchable units).
// Duplicate tokens are removed to avoid inflating match scores.
export function tokenize(normalizedText: string): string[] {
  const tokens = normalizedText.split(/\s+/).filter((t) => t.length > 0);
  return [...new Set(tokens)];
}

// Test whether a single token appears in text as a whole-word or prefix match.
// - For numeric tokens and short tokens: strict word-boundary matching
//   (prevents "11" from matching inside "110")
// - For alphabetic tokens ≥3 chars: also allows prefix matching
//   (so "pipe" matches "pipes", "elbow" matches "elbows")
export function tokenMatchesText(token: string, text: string): boolean {
  try {
    let searchWord = token;
    
    // Heuristic stemming for plurals (handles 95% of hardware searches like pipes, elbows, tees, valves)
    if (searchWord.length > 3 && /^[a-z]+$/.test(searchWord)) {
      if (searchWord.endsWith('s') && !searchWord.endsWith('ss')) {
        searchWord = searchWord.slice(0, -1); // pipes -> pipe, valves -> valve
      }
    }

    const escaped = escapeRegex(searchWord);
    
    // Exact word-boundary match first (works for all token types)
    const exactRegex = new RegExp('(?:^|\\b)' + escaped + '(?:\\b|$)');
    if (exactRegex.test(text)) return true;

    // For alphabetic tokens ≥3 chars, also try prefix matching.
    // This handles partial forms naturally.
    if (searchWord.length >= 3 && /^[a-z]+$/.test(searchWord)) {
      const prefixRegex = new RegExp('(?:^|\\b)' + escaped);
      return prefixRegex.test(text);
    }
    return false;
  } catch {
    // Fallback: plain substring match (should never happen in practice).
    return text.includes(token);
  }
}

// --- Field-level keys (index side) ----------------------------------------

// Size "¾ Inch (25 mm)" -> "3/4 25 25mm"; "110X63 mm" -> "110x63 110 63 63mm".
export function normalizeSize(size: string | null): string {
  if (!size) return '';

  // Extract compound dimensions from the RAW lowercase string BEFORE
  // normalizeText applies digit-letter splitting.
  const rawLower = size.toLowerCase();
  const s = normalizeText(size);
  const tokens: string[] = [];

  // Compound dimensions: 110X63, 4x2.5, 20x15
  const axbRaw = rawLower.match(/(\d[\d.]*)x(\d[\d.]*)/);
  if (axbRaw) {
    tokens.push(`${axbRaw[1]}x${axbRaw[2]}`, axbRaw[1], axbRaw[2]);
  }

  const inchMatch = s.match(/([0-9/ ]+?)\s*inch/);
  if (inchMatch) tokens.push(inchMatch[1].trim());
  const mmMatch = s.match(/(\d+)\s*mm/);
  if (mmMatch) tokens.push(mmMatch[1], `${mmMatch[1]}mm`);

  if (tokens.length === 0) tokens.push(s);
  return [...new Set(tokens)].join(' ');
}

// Variant "SCH-80" -> "sch 80 sch80"; "SDR 11" -> "sdr 11 sdr11".
// "Standard" carries no salesman signal -> empty (still displayed via catalog).
export function normalizeVariant(variant: string | null): string {
  if (!variant || variant.toLowerCase() === 'standard') return '';
  const base = normalizeText(variant); // hyphen already -> space
  // Generate glued form for compound variants (sch 80 -> sch80, sdr 11 -> sdr11)
  const glued = base.replace(/([a-z]+)\s+(\d+)/g, '$1$2');
  return glued === base ? base : `${base} ${glued}`;
}

// Pressure "15 kgf/cm²" -> "15kg 15 kg".
export function normalizePressure(pressure: string | null): string {
  if (!pressure) return '';
  const num = pressure.match(/([\d.]+)/);
  if (!num) return '';
  return `${num[1]}kg ${num[1]} kg`;
}

// --- Searchable text (for token-based hybrid search) ----------------------

// Build a comprehensive normalized string from all product fields.
// Used by the token-based exact match stage (Stage 1). Contains redundant
// representations (raw normalized text + expanded keys) to maximize recall.
// The result is never displayed — it exists purely for retrieval.
export function buildSearchableText(
  productName: string,
  category: string | null,
  variant: string | null,
  size: string | null,
  pressure: string | null,
  sizeKey: string,
  variantKey: string,
  pressureKey: string,
): string {
  const parts = [
    normalizeText(productName),
    category ? normalizeText(category) : '',
    // Only include variant if it's meaningful (not "Standard")
    variant && variant.toLowerCase() !== 'standard'
      ? normalizeText(variant)
      : '',
    size ? normalizeText(size) : '',
    pressure ? normalizeText(pressure) : '',
    sizeKey,     // expanded size forms: "3/4 25 25mm"
    variantKey,  // expanded variant forms: "sdr 11 sdr11"
    pressureKey, // expanded pressure: "10kg 10 kg"
  ];
  return parts.filter((p) => p.trim()).join(' ');
}
