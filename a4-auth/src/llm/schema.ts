import { z } from "zod";

export const triageInputSchema = z
  .object({
    text: z
      .string({ required_error: "text is required", invalid_type_error: "text must be a string" })
      .trim()
      .min(1, "text must not be empty")
      .max(2000, "text must be at most 2000 characters"),
  })
  .strict();

export const triageResultSchema = z
  .object({
    category: z.enum(["authentication", "api", "database", "billing", "other"]),
    urgency: z.enum(["low", "normal", "high"]),
    suggestedTeam: z.enum(["backend", "frontend", "support"]),
    confidence: z.number().min(0).max(1),
    reason: z.string().trim().min(1).max(240),
  })
  .strict();

export type TriageInput = z.infer<typeof triageInputSchema>;
export type TriageResult = z.infer<typeof triageResultSchema>;

export const STUB_TRIAGE_RESULT: TriageResult = {
  category: "authentication",
  urgency: "normal",
  suggestedTeam: "backend",
  confidence: 0.9,
  reason: "Stub mode classified the message as an authentication issue.",
};

