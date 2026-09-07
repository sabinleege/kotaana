export class AiNotConfiguredError extends Error {
  constructor(which = "AI keys") {
    super(`AI is not configured. Add ${which} to server environment (never in frontend).`);
    this.name = "AiNotConfiguredError";
  }
}
