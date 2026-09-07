/**
 * Refusal messages when the user is outside app context.
 */

export function getRefusalMessage(reason?: string): string {
  return (
    "I'm Kotaana's coaching assistant. I only help with **workouts, nutrition, recovery, progress, injuries/pregnancy-safe training, and using this app** (coaches, plans, MoMo payments in Settings).\n\n" +
    "I can't answer general topics outside that context.\n\n" +
    "Try asking about today's workout, meals, sleep, an injury restriction, or your goal plan." +
    (reason ? `\n\n_(${reason})_` : "")
  );
}

export function getSafetyRefusal(): string {
  return (
    "I can't help with that request. If you're dealing with a medical emergency, contact local emergency services or a qualified clinician.\n\n" +
    "For training or recovery questions inside Kotaana, I'm here to help within coaching limits — not as a doctor."
  );
}
