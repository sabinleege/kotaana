import type { ModelRole } from "./types";

/** Ordered fallback roles when primary fails. */
export function fallbackChain(primary: ModelRole): ModelRole[] {
  switch (primary) {
    case "vision":
      return ["vision", "everyday", "fallback"];
    case "agent":
      return ["agent", "reasoning", "everyday", "fallback"];
    case "reasoning":
      return ["reasoning", "agent", "everyday", "fallback"];
    case "long_context":
      return ["long_context", "agent", "reasoning", "fallback"];
    case "everyday":
    default:
      return ["everyday", "fallback", "agent"];
  }
}
