import "dotenv/config";
import OpenAI from "openai";

async function main(): Promise<void> {
  const baseURL = process.env.LLM_BASE_URL;
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;

  if (!baseURL || !apiKey || !model) {
    throw new Error(
      "Set LLM_BASE_URL, LLM_API_KEY, and LLM_MODEL in .env before running llm:hello."
    );
  }

  const timeout = Math.min(Number(process.env.LLM_TIMEOUT_MS || 30_000), 60_000);
  const client = new OpenAI({ baseURL, apiKey, timeout, maxRetries: 0 });
  const response = await client.chat.completions.create({
    model,
    temperature: 0,
    messages: [{ role: "user", content: "Reply with exactly the word: ready" }],
  });

  console.log(response.choices[0]?.message.content ?? "No response");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
