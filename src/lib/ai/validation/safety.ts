/** Soft medical boundary — product must not claim diagnosis. */
export const MEDICAL_DISCLAIMER =
  "AI coaching tips are not medical diagnosis or treatment. Seek a clinician for injuries, pregnancy, or emergency symptoms.";

export function appendMedicalSafety(system: string): string {
  return `${system}\n\nSAFETY: ${MEDICAL_DISCLAIMER}`;
}
