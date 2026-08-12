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

export class LlmTimeoutError extends Error {
  constructor() {
    super("The model provider did not respond before the timeout.");
    this.name = "LlmTimeoutError";
  }
}

export class LlmProviderError extends Error {
  constructor(public readonly status?: number) {
    super("The model provider request failed.");
    this.name = "LlmProviderError";
  }
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
  extraSystemInstruction?: string,
  repairCount = 0
): Promise<RawModelAnswer> {
  const model = required("LLM_MODEL");
  const prompt = await loadTriagePrompt();
  const systemPrompt = extraSystemInstruction
    ? `${prompt}\n\n## Correction required\n${extraSystemInstruction}`
    : prompt;

  const timeout = Math.min(Number(process.env.LLM_TIMEOUT_MS || 30_000), 60_000);
  const maxRetries = Math.min(Math.max(Number(process.env.LLM_MAX_RETRIES || 2), 0), 3);
  const client = new OpenAI({
    baseURL: required("LLM_BASE_URL"),
    apiKey: required("LLM_API_KEY"),
    timeout,
    maxRetries: 0,
  });
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: JSON.stringify({ source: "support_message", text: input.text }),
    },
  ];

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const startedAt = Date.now();
    try {
      const response = await client.chat.completions.create({ model, temperature: 0, messages });
      const answer = {
        content: response.choices[0]?.message.content || "",
        model,
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
      };
      console.log(JSON.stringify({
        event: "llm_call",
        promptVersion: PROMPT_VERSION,
        model,
        inputTokens: answer.inputTokens,
        outputTokens: answer.outputTokens,
        durationMs: Date.now() - startedAt,
        repairCount,
        retryAttempt: attempt,
      }));
      return answer;
    } catch (error) {
      const status = statusFrom(error);
      const timeoutFailure = isTimeout(error);
      const retryable = timeoutFailure || status === 429 || (status !== undefined && status >= 500);
      console.error(JSON.stringify({
        event: "llm_call_failed",
        promptVersion: PROMPT_VERSION,
        model,
        durationMs: Date.now() - startedAt,
        repairCount,
        retryAttempt: attempt,
        status: status || null,
        timeout: timeoutFailure,
        willRetry: retryable && attempt < maxRetries,
      }));

      if (!retryable || attempt === maxRetries) {
        if (timeoutFailure) throw new LlmTimeoutError();
        throw new LlmProviderError(status);
      }
      await sleep(retryDelayMs(error, attempt));
    }
  }

  throw new LlmProviderError();
}

function statusFrom(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) return undefined;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

function isTimeout(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name.toLowerCase().includes("timeout") || error.message.toLowerCase().includes("timed out");
}

function retryDelayMs(error: unknown, attempt: number): number {
  if (typeof error === "object" && error !== null && "headers" in error) {
    const headers = (error as { headers?: { get?: (name: string) => string | null } }).headers;
    const value = headers?.get?.("retry-after");
    if (value) {
      const seconds = Number(value);
      if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
      const dateDelay = Date.parse(value) - Date.now();
      if (Number.isFinite(dateDelay)) return Math.max(0, dateDelay);
    }
  }
  return 1000 * 2 ** attempt + Math.floor(Math.random() * 250);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}
