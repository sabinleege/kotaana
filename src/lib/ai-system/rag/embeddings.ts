/**
 * Embeddings helper.
 * For production you can swap this to OpenAI, Voyage, or a local model.
 * Currently uses a simple deterministic hash-based pseudo-embedding for scaffolding
 * so the rest of the RAG pipeline works without external keys during development.
 */

export type Embedding = number[];

/** Very simple bag-of-words style embedding (replace with real model later). */
export async function embed(text: string): Promise<Embedding> {
  const tokens = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  const dim = 64;
  const vec = new Array(dim).fill(0);

  for (const token of tokens) {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash * 31 + token.charCodeAt(i)) >>> 0;
    }
    vec[hash % dim] += 1;
  }

  // L2 normalise
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export function cosineSimilarity(a: Embedding, b: Embedding): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}
