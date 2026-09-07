import { BaseAgent } from "./base-agent";

export class NutritionCoachAgent extends BaseAgent {
  readonly id = "nutrition-coach";
  readonly name = "Nutrition & Meal Coach";
  readonly description = "Meal structure, protein targets, practical food advice";

  protected systemExtra = `
You are the Nutrition Coach.
Give practical meal and macro guidance. Respect allergies and dietary style.
Do not prescribe medical diets or treat disease through food claims.
`;

  protected defaultMessage() {
    return "Based on my profile, suggest a simple daily meal structure and protein target.";
  }
}

export const nutritionCoachAgent = new NutritionCoachAgent();
