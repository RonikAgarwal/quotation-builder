import Fuse from 'fuse.js';
import type { Product } from '../types';
import { normalizeText, tokenize, tokenMatchesText } from './normalize';

// ---------------------------------------------------------------------------
// Hybrid Search Engine — Modular Pipeline
// ---------------------------------------------------------------------------
// Stage 1: Exact Token Retrieval (Order & Field Independent)
// Stage 2: Fuzzy Token Retrieval (Typo tolerance fallback via Fuse.js)
// Stage 3: Semantic Retrieval (FUTURE: Gemini embeddings fallback)
// ---------------------------------------------------------------------------

export interface SearchHit {
  product: Product;
  exactHits: number;
  nameHits: number;
  fuseScore: number;
  finalScore: number;
}

export function createSearchIndex(products: Product[]): Fuse<Product> {
  return new Fuse(products, {
    includeScore: true,
    ignoreLocation: true,
    threshold: 0.4,
    minMatchCharLength: 1,
    keys: ['searchText'],
  });
}

// --- Stage 1: Exact Token Retrieval ---
// Finds products that contain the exact query tokens (prefix-matched for words)
export function runTokenRetrieval(products: Product[], tokens: string[]): Map<string, SearchHit> {
  const scores = new Map<string, SearchHit>();

  for (const product of products) {
    let exactHits = 0;
    let nameHits = 0;
    const normalizedName = normalizeText(product.productName);

    for (const token of tokens) {
      if (tokenMatchesText(token, product.searchText)) {
        exactHits++;
        if (tokenMatchesText(token, normalizedName)) {
          nameHits++;
        }
      }
    }

    if (exactHits > 0) {
      scores.set(product.id, {
        product,
        exactHits,
        nameHits,
        fuseScore: 0,
        finalScore: 0,
      });
    }
  }

  return scores;
}

// --- Stage 2: Fuzzy Token Retrieval ---
// Uses Fuse.js per-token to catch typos (e.g. elbw -> elbow).
// Mutates the scores map to add/update hits.
export function runFuzzyRetrieval(index: Fuse<Product>, tokens: string[], scores: Map<string, SearchHit>) {
  for (const token of tokens) {
    if (token.length < 2) continue; // Too short for meaningful fuzzy matching
    
    const fuseResults = index.search(token, { limit: 100 });
    for (const r of fuseResults) {
      const tokenFuseScore = (1 - (r.score ?? 1)) / tokens.length;
      const existing = scores.get(r.item.id);
      
      if (existing) {
        existing.fuseScore += tokenFuseScore;
      } else {
        scores.set(r.item.id, {
          product: r.item,
          exactHits: 0,
          nameHits: 0,
          fuseScore: tokenFuseScore,
          finalScore: 0,
        });
      }
    }
  }
}

// --- Stage 3: Semantic Retrieval (Placeholder) ---
// To be implemented later with Gemini embeddings.
// export async function runSemanticRetrieval(query: string, limit: number): Promise<Product[]> { ... }

const CATEGORY_ORDER = ['pvc', 'swr', 'cpvc', 'upvc', 'borewell'];

function getCategoryRank(category: string | null | undefined): number {
  if (!category) return 999;
  const index = CATEGORY_ORDER.indexOf(category.toLowerCase());
  return index === -1 ? 999 : index;
}

// --- Ranking Layer ---
export function rankResults(scores: Map<string, SearchHit>, numTokens: number, limit: number): SearchHit[] {
  // Compute final scores
  for (const hit of scores.values()) {
    // Suppress fuzzy noise if the item already perfectly matched all exact tokens.
    // This ensures all perfect matches tie mathematically and properly fall through to 
    // the category and alphabetical tiebreakers.
    if (hit.exactHits === numTokens) {
      hit.fuseScore = 0;
    }

    const exactScore = hit.exactHits / numTokens; // 0..1
    const nameBonus = hit.nameHits / numTokens;   // 0..1
    hit.finalScore = (exactScore * 0.55) + (hit.fuseScore * 0.30) + (nameBonus * 0.15);
  }

  return Array.from(scores.values())
    .filter((r) => r.finalScore > 0.05)
    .sort((a, b) => {
      // Primary: more exact token hits first
      // An exact hit on a user's search token is fundamentally better than any fuzzy fallback match.
      if (b.exactHits !== a.exactHits) return b.exactHits - a.exactHits;

      // Secondary: final score (descending)
      if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;

      // Tiebreaker 2: more matches in the actual product name
      if (b.nameHits !== a.nameHits) return b.nameHits - a.nameHits;
      
      // Tiebreaker 3: Category priority (PVC > SWR > CPVC > UPVC > Borewell)
      const rankA = getCategoryRank(a.product.category);
      const rankB = getCategoryRank(b.product.category);
      if (rankA !== rankB) return rankA - rankB;

      // Tiebreaker 4: alphabetical by name (stable sort)
      return a.product.productName.localeCompare(b.product.productName);
    })
    .slice(0, limit);
}

// --- Main Search Pipeline ---
export function runSearch(
  products: Product[],
  index: Fuse<Product>,
  query: string,
  limit = 50,
): Product[] {
  const q = query.trim();
  if (!q) return [];

  const normalized = normalizeText(q);
  const tokens = tokenize(normalized);
  if (tokens.length === 0) return [];

  // Stage 1: Fast Exact Token Retrieval
  const scores = runTokenRetrieval(products, tokens);

  // Confidence Gate (Do we have enough exact matches?)
  const fullMatchCount = [...scores.values()].filter((s) => s.exactHits === tokens.length).length;

  // Stage 2: Fuzzy Retrieval (Fallback for typos)
  if (fullMatchCount < limit) {
    runFuzzyRetrieval(index, tokens, scores);
  }

  // Ranking
  const ranked = rankResults(scores, tokens.length, limit);

  // ---------------------------------------------------------
  // FUTURE: Stage 3 Semantic Fallback Integration Point
  // ---------------------------------------------------------
  // if (ranked.length === 0 || ranked[0].finalScore < 0.3) {
  //    // Note: this would make runSearch async
  //    return await runSemanticRetrieval(query, limit);
  // }
  // ---------------------------------------------------------

  return ranked.map((r) => r.product);
}

// --- Hybrid Search Intent Detection ---
export function isSpecificQuery(query: string): boolean {
  const q = query.toLowerCase();
  
  if (/[\d\/¼½¾]/.test(q) && q.includes('/')) return true; // raw check for fractions like 3/4
  if (/[¼½¾]/.test(q)) return true;

  const tokens = tokenize(normalizeText(q));

  for (const t of tokens) {
    // Explicit keywords
    if (/^(sch|sdr|class|inch|mm|kg|kgf|pn)$/.test(t)) return true;
    
    // Numbers attached to letters (e.g. sdr11, 25mm, sch80)
    if (/\d[a-z]|[a-z]\d/.test(t)) return true;
    
    // Standalone numbers that are NOT common angles (which are in family names like ELBOW 90)
    if (/^\d+(\.\d+)?$/.test(t)) {
      if (t !== '45' && t !== '90' && t !== '87' && t !== '87.5') {
        return true;
      }
    }
  }

  return false;
}
