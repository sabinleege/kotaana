/**
 * AI module public exports
 */

export { checkScope } from "./scope-guard";
export { getRefusalMessage, getSafetyRefusal } from "./refusal";
export { buildContext } from "./context-builder";
export type { BuiltContext, ChatMessage } from "./context-builder";
export { retrieve, invalidateIndex } from "./rag/retriever";
export type { RetrievedChunk } from "./rag/retriever";
