/**
 * Simple in-memory RAG retriever.
 * In production replace the knowledge store with a vector database (pgvector, Pinecone, etc.).
 */

import { embed, cosineSimilarity, type Embedding } from "./embeddings";
import { KNOWLEDGE } from "./knowledge";

export type RetrievedChunk = {
  id: string;
  title: string;
  content: string;
  score: number;
};

type IndexedChunk = {
  id: string;
  title: string;
  content: string;
  embedding: Embedding;
};

let INDEX: IndexedChunk[] | null = null;

async function ensureIndex(): Promise<IndexedChunk[]> {
  if (INDEX) return INDEX;

  const chunks: IndexedChunk[] = [];
  for (const doc of KNOWLEDGE) {
    const embedding = await embed(`${doc.title}\n${doc.content}`);
    chunks.push({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      embedding,
    });
  }
  INDEX = chunks;
  return INDEX;
}

/** Retrieve top-k most relevant knowledge chunks for a query. */
export async function retrieve(query: string, k = 4): Promise<RetrievedChunk[]> {
  const index = await ensureIndex();
  const queryEmb = await embed(query);

  const scored = index.map((chunk) => ({
    id: chunk.id,
    title: chunk.title,
    content: chunk.content,
    score: cosineSimilarity(queryEmb, chunk.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k).filter((c) => c.score > 0.05);
}

/** Force rebuild of the in-memory index (call after knowledge base changes). */
export function invalidateIndex() {
  INDEX = null;
}
