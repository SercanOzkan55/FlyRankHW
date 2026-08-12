import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import OpenAI from "openai";
import { TriageInput } from "./schema";

export const PROMPT_VERSION = "triage-v1";

export interface RawModelAnswer {
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

function required(name: "LLM_BASE_URL" | "LLM_API_KEY" | "LLM_MODEL"): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export async function loadTriagePrompt(): Promise<string> {
  return readFile(resolve(process.cwd(), "prompts", `${PROMPT_VERSION}.md`), "utf8");
}

export async function requestTriageCompletion(
  input: TriageInput,
  extraSystemInstruction?: string
): Promise<RawModelAnswer> {
  const model = required("LLM_MODEL");
  const prompt = await loadTriagePrompt();
  const systemPrompt = extraSystemInstruction
    ? `${prompt}\n\n## Correction required\n${extraSystemInstruction}`
    : prompt;

  const client = new OpenAI({
    baseURL: required("LLM_BASE_URL"),
    apiKey: required("LLM_API_KEY"),
    timeout: Number(process.env.LLM_TIMEOUT_MS || 30_000),
    maxRetries: 0,
  });

  const response = await client.chat.completions.create({
    model,
    temperature: 0,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: JSON.stringify({ source: "support_message", text: input.text }),
      },
    ],
  });

  return {
    content: response.choices[0]?.message.content || "",
    model,
    inputTokens: response.usage?.prompt_tokens || 0,
    outputTokens: response.usage?.completion_tokens || 0,
  };
}

