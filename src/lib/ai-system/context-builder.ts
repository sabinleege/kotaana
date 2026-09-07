/**
 * Builds the final context that is sent to the LLM.
 * Combines: scope check → RAG retrieval → profile report → conversation history.
 */

import { checkScope } from "./scope-guard";
import { getRefusalMessage, getSafetyRefusal } from "./refusal";
import { retrieve } from "./rag/retriever";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type BuiltContext = {
  allowed: boolean;
  refusal?: string;
  systemPrompt: string;
  userPrompt: string;
  retrievedTitles: string[];
};

const BASE_SYSTEM = `You are Kotaana's AI coaching assistant.
Be encouraging, concise, and practical.
Give evidence-based fitness and nutrition guidance.
Never give medical diagnoses — advise seeing a professional for medical concerns.
Strictly respect the athlete's stated injuries, conditions and pregnancy status.
Only answer questions related to fitness, training, nutrition, recovery, progress tracking, and coaching inside the Kotaana app.
If a question is outside that domain, politely refuse.`;

const GUIDE_WALL = `GUIDE WALLS (mandatory):
1. Only discuss Kotaana context: training, nutrition, recovery, body metrics, injuries/pregnancy-safe exercise, coach-athlete features, in-app payments (MoMo).
2. If the user asks about politics, homework, coding unrelated to fitness, celebrities, general trivia, or anything off-topic → refuse briefly and redirect.
3. Never invent medical diagnoses. Suggest clinician care when appropriate.
4. Prefer short, actionable coaching answers grounded in the profile report / RAG snippets provided.
5. Do not discuss card/Stripe payments; platform payments use MoMo only.`;

export async function buildContext(opts: {
  message: string;
  history?: ChatMessage[];
  profileReport?: string;
}): Promise<BuiltContext> {
  const { message, history = [], profileReport = "No profile yet." } = opts;

  // 1. Scope check
  const scope = checkScope(message);
  if (!scope.allowed) {
    const refusal =
      scope.reason?.includes("safety") || scope.reason?.includes("violates")
        ? getSafetyRefusal()
        : getRefusalMessage();

    return {
      allowed: false,
      refusal,
      systemPrompt: BASE_SYSTEM,
      userPrompt: "",
      retrievedTitles: [],
    };
  }

  // 2. Retrieve relevant knowledge
  const chunks = await retrieve(message, 4);
  const knowledgeBlock =
    chunks.length > 0
      ? chunks.map((c) => `### ${c.title}\n${c.content.trim()}`).join("\n\n")
      : "No extra knowledge retrieved.";

  // 3. Conversation window
  const convo = history
    .slice(-8)
    .map((h) => `${h.role === "user" ? "Athlete" : "Coach"}: ${h.content}`)
    .join("\n");

  // 4. Final prompt
  const userPrompt = `
ATHLETE PROFILE REPORT:
${profileReport}

RELEVANT KNOWLEDGE:
${knowledgeBlock}

${convo ? `RECENT CONVERSATION:\n${convo}\n` : ""}
Athlete: ${message}
Coach:`.trim();

  return {
    allowed: true,
    systemPrompt: BASE_SYSTEM + "\n\n" + GUIDE_WALL,
    userPrompt,
    retrievedTitles: chunks.map((c) => c.title),
  };
}
