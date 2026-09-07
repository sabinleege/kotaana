/**
 * Static knowledge base used by the RAG system.
 * Later this can be loaded from markdown files or a database.
 */

export type KnowledgeDoc = {
  id: string;
  title: string;
  content: string;
  tags: string[];
};

export const KNOWLEDGE: KnowledgeDoc[] = [
  {
    id: "fitness-basics",
    title: "Fitness Training Basics",
    tags: ["fitness", "training"],
    content: `
Progressive overload is the foundation of getting stronger: gradually increase weight, reps, or volume over time.
Aim for 2–5 sessions per week depending on recovery and experience.
Compound movements (squat, hinge, push, pull) should form the core of most programs.
Always warm up before heavy lifting. Respect pain — sharp joint pain is a stop signal.
`,
  },
  {
    id: "nutrition-basics",
    title: "Nutrition Guidelines",
    tags: ["nutrition"],
    content: `
Protein target for active people is roughly 1.6–2.2 g per kg of bodyweight.
Create a calorie deficit for fat loss and a surplus for muscle gain — both should be moderate.
Prioritise whole foods, vegetables, and adequate hydration (often 30–40 ml per kg).
There is no single best diet; adherence and consistency matter more than perfection.
`,
  },
  {
    id: "recovery",
    title: "Recovery & Sleep",
    tags: ["recovery", "sleep"],
    content: `
Sleep is the most powerful recovery tool. Aim for 7–9 hours of quality sleep.
Manage stress and avoid stacking hard sessions on consecutive days without reason.
Soreness is normal; performance drop and joint pain are not.
Active recovery (light walking, mobility) often helps more than complete rest.
`,
  },
  {
    id: "injury-safety",
    title: "Injury & Medical Safety",
    tags: ["injury", "medical"],
    content: `
Kotaana does not diagnose or treat medical conditions.
If you have sharp pain, swelling, numbness, or unexplained symptoms, stop training and consult a qualified professional.
Previous injuries should be shared in your profile so plans can be adjusted.
Never push through pain that feels structural.
`,
  },
  {
    id: "pregnancy",
    title: "Pregnancy Training Safety",
    tags: ["pregnancy", "medical"],
    content: `
If you are pregnant, always follow medical advice from your doctor or midwife first.
Many women can continue modified training, but intensity, impact, and certain positions may need to change.
Mark yourself as pregnant in the app so the AI only suggests prenatal-safe options.
Hydration, heat management, and listening to your body become even more important.
`,
  },
  {
    id: "app-features",
    title: "Kotaana App Features",
    tags: ["app"],
    content: `
You can log workouts, meals, weight, daily check-ins, and progress photos.
Connect with a coach via invite code or connect code so they can follow your progress.
The AI uses your profile report (refreshed every 3 days) to personalise advice.
Track Me (when enabled) can pull distance data from health platforms.
`,
  },
  {
    id: "coach-guidelines",
    title: "Working with a Coach",
    tags: ["coach"],
    content: `
A coach can view your logged data, leave notes, set follow-ups, and schedule sessions once you are connected.
You stay in control of your data and can disconnect at any time.
Coaches do not replace medical professionals.
`,
  },
  {
    id: "safety-rules",
    title: "AI Safety Rules",
    tags: ["safety"],
    content: `
The AI must never give medical diagnoses or prescribe medication.
It must refuse topics outside fitness, nutrition, recovery, and coaching.
It must respect injuries, pregnancy flags, and stated health conditions.
When unsure, it should recommend speaking to a qualified professional.
`,
  },
];
