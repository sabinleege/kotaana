# Kotaana AI Router

## Keys (server only)
- `GEMINI_API_KEY` — everyday + vision
- `OPENROUTER_API_KEY` — Nemotron / DeepSeek / Gemma fallback

Never use `NEXT_PUBLIC_*` for these. Never commit `.env.local`.

## Routing
| Task | Role | Default model |
|------|------|----------------|
| simple_chat, summary, nutrition | everyday | gemini-2.5-flash-lite |
| meal_vision, progress_photo, medical | vision | gemini-2.5-flash |
| workout_generation, goal_planning | agent | nvidia/nemotron…:free |
| complex_reasoning, risk | reasoning | deepseek-r1-0528:free |
| long_context_analysis | long_context | Nemotron |
| failures | fallback | gemma-4 free |

## Code
- Router: `src/lib/ai/router.ts`
- Facade (existing imports): `src/lib/ai.ts` → `generateText` / `generateJson` / `generateJsonFromImage`
- Providers: `src/lib/ai/providers/{gemini,openrouter}.ts`

## Vercel
Add the same keys in Project → Settings → Environment Variables (Production + Preview).
