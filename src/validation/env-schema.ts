import { z } from "zod";

const envSchema = z.object({
  ANTHROPIC_API_KEY: z
    .string()
    .optional()
    .describe("API key for Anthropic's API"),
  GROQ_API_KEY: z
    .string()
    .min(1, "API key for GROQ API is required")
    .describe("API key for GROQ API"),
  OPENAI_API_KEY: z.string().optional().describe("API key for OpenAI's API"),
  OPENROUTER_API_KEY: z
    .string()
    .optional()
    .describe("API key for OpenRouter's API"),
  GEMINI_API_KEY: z
    .string()
    .optional()
    .describe("API key for Google's Gemini API"),
  DEEPSEEK_API_KEY: z
    .string()
    .optional()
    .describe("API key for DeepSeek's API"),
  PROVIDER: z
    .enum([
      "claude",
      "groq",
      "ollama",
      "openai",
      "openrouter",
      "gemini",
      "deepseek",
    ])
    .default("groq")
    .describe(
      "LLM provider to use (claude or groq or ollama or openai or openrouter or gemini or deepseek)",
    ),
});

export { envSchema };
