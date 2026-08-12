import { appendFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { PROMPT_VERSION, requestTriageCompletion, RawModelAnswer } from "./client";
import { TriageInput, TriageResult, triageResultSchema } from "./schema";

export class TriageValidationError extends Error {
  constructor() {
    super("The model could not produce a valid triage result after one repair attempt.");
    this.name = "TriageValidationError";
  }
}

function extractJsonObject(raw: string): string {
  const withoutFence = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("No JSON object found");
  return withoutFence.slice(start, end + 1);
}

function validateAnswer(raw: string): TriageResult {
  const parsed: unknown = JSON.parse(extractJsonObject(raw));
  return triageResultSchema.parse(parsed);
}

function describeValidationFailure(error: unknown): string {
  if (error instanceof Error) return error.message.slice(0, 1200);
  return "Unknown parsing or validation error";
}

async function quarantine(
  input: TriageInput,
  raw: string,
  error: unknown
): Promise<void> {
  const logDir = resolve(process.cwd(), "logs");
  await mkdir(logDir, { recursive: true });
  const entry = {
    timestamp: new Date().toISOString(),
    promptVersion: PROMPT_VERSION,
    input,
    rawModelOutput: raw,
    error: describeValidationFailure(error),
  };
  await appendFile(
    resolve(logDir, "quarantine.jsonl"),
    `${JSON.stringify(entry)}\n`,
    "utf8"
  );
}

export interface TriageRun {
  result: TriageResult;
  calls: RawModelAnswer[];
  repairCount: number;
}

export async function runTriage(input: TriageInput): Promise<TriageRun> {
  const first = await requestTriageCompletion(input);
  try {
    return { result: validateAnswer(first.content), calls: [first], repairCount: 0 };
  } catch (firstError) {
    const repairInstruction = [
      "Your previous answer was rejected.",
      `Validation error: ${describeValidationFailure(firstError)}`,
      `Rejected answer: ${JSON.stringify(first.content)}`,
      "Return only corrected JSON matching the original schema.",
    ].join("\n");
    const second = await requestTriageCompletion(input, repairInstruction, 1);
    try {
      return { result: validateAnswer(second.content), calls: [first, second], repairCount: 1 };
    } catch (secondError) {
      await quarantine(input, second.content, secondError);
      throw new TriageValidationError();
    }
  }
}
