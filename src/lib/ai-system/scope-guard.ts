/**
 * Scope Guard — AI only answers in-app fitness coaching context.
 * Default: deny anything that is not clearly about training, nutrition,
 * recovery, the product, or coach–athlete workflow.
 */

export type ScopeResult = {
  allowed: boolean;
  reason?: string;
  category?:
    | "fitness"
    | "nutrition"
    | "recovery"
    | "app"
    | "coach"
    | "medical-safety"
    | "out-of-scope";
};

const ALLOWED_KEYWORDS = [
  "workout", "exercise", "training", "gym", "sets", "reps", "strength", "cardio",
  "run", "running", "walk", "cycling", "hiit", "mobility", "stretch", "form",
  "progress", "plan", "program", "routine", "session", "volume", "intensity",
  "lift", "squat", "deadlift", "bench", "press", "pull", "push", "core",
  "meal", "food", "diet", "protein", "calories", "carb", "fat", "nutrition",
  "eat", "hungry", "macro", "supplement", "water", "hydrate", "breakfast", "lunch", "dinner",
  "recovery", "sleep", "soreness", "injury", "pain", "rest", "fatigue",
  "energy", "readiness", "check-in", "checkin", "check in",
  "pregnant", "pregnancy", "hurt", "doctor", "medical", "condition", "illness", "sick",
  "coach", "athlete", "invite", "connect", "photo", "track", "goal", "weight", "bmi",
  "profile", "subscription", "payment", "momo", "plan", "ai", "chat", "kotaana",
  "kotaana", "app", "settings", "notification", "equipment", "warm", "cool down",
  "adherence", "follow-up", "follow up", "risk", "hydration", "steps", "distance",
];

const GREETINGS = /^(hi|hello|hey|good (morning|afternoon|evening)|thanks|thank you|ok|okay|yes|no|yep|nope)[\s!.?]*$/i;

const BLOCKED_PATTERNS = [
  /how to (make|build|create).*(bomb|weapon|gun|explosive)/i,
  /hack(ing)? (into|password|account)/i,
  /(kill|murder|suicide|self[- ]harm)/i,
  /(illegal|steal|fraud|scam) (money|card|identity)/i,
  /write (me )?(a )?(virus|malware|ransomware)/i,
  /\b(politics|election|democrat|republican|parliament)\b/i,
  /\b(crypto|bitcoin|forex|nft|stock tip)\b/i,
  /(homework|essay|assignment) (for me|write)/i,
  /\b(girlfriend|boyfriend|dating advice|love life)\b/i,
  /\b(recipe for (cake|cookies|pizza)(?!.*(protein|fitness|athlete|pre-?workout)))/i,
  /\b(who (won|is the president)|capital of|history of)\b/i,
  /\b(write (code|python|javascript)(?!.*(workout|fitness|app)))/i,
  /\b(movie|netflix|celebrity|gossip)\b/i,
  /\b(religion|bible verse|quran)\b/i,
];

/**
 * First line of defence before the LLM.
 * Messages must look like fitness / app / coaching context, or a short greeting.
 */
export function checkScope(message: string): ScopeResult {
  const text = message.toLowerCase().trim();

  if (text.length < 2) {
    return { allowed: false, reason: "Empty message", category: "out-of-scope" };
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return {
        allowed: false,
        reason: "Request is outside Kotaana scope or violates safety policy",
        category: "out-of-scope",
      };
    }
  }

  if (GREETINGS.test(text)) {
    return { allowed: true, category: "app" };
  }

  const hasAllowed = ALLOWED_KEYWORDS.some((kw) => text.includes(kw));
  if (hasAllowed) {
    if (/injur|pain|pregnant|sick|illness|doctor|chest pain/.test(text)) {
      return { allowed: true, category: "medical-safety" };
    }
    if (/meal|food|protein|calor|diet|nutrition|water|hydrat/.test(text)) {
      return { allowed: true, category: "nutrition" };
    }
    if (/coach|invite|connect|subscription|momo|payment|settings/.test(text)) {
      return { allowed: true, category: "coach" };
    }
    return { allowed: true, category: "fitness" };
  }

  // Short vague follow-ups that may refer to prior workout context
  if (text.length <= 40 && /^(what|how|why|when|can i|should i|is it|about|and|more)\b/.test(text)) {
    return { allowed: true, category: "fitness", reason: "short follow-up" };
  }

  return {
    allowed: false,
    reason: "Question is outside Kotaana coaching context",
    category: "out-of-scope",
  };
}
