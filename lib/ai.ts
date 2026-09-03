import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

export class InvalidAIResponseError extends Error {
  constructor(rawResponse: string) {
    super(`AI returned an invalid response: "${rawResponse}"`);
    this.name = "InvalidAIResponseError";
  }
}

/**
 * Sends a prompt to the LLM and returns strictly "YES" or "NO".
 * Throws InvalidAIResponseError if the model returns anything else.
 */
export async function askYesNo(prompt: string): Promise<"YES" | "NO"> {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction:
      "You are a strict decision engine. You must respond with exactly one word: YES or NO. No punctuation, no explanation, no other text of any kind.",
    generationConfig: {
      temperature: 0,
    },
  });

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();
  const normalized = raw.toUpperCase();

  if (normalized === "YES" || normalized === "NO") {
    return normalized;
  }

  throw new InvalidAIResponseError(raw);
}