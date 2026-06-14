// services/gemini.service.ts
import type { LLMMessage, LLMTool } from "../types/common";
import { envs } from "../config/envs";

export async function callGemini(messages: LLMMessage[], tools: LLMTool[]) {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${envs.GEMINI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        max_tokens: 4096,
        tools:
          tools.length > 0
            ? tools.map((t) => ({
                type: "function",
                function: {
                  name: t.name,
                  description: t.description,
                  parameters: t.input_schema,
                },
              }))
            : undefined,
        messages,
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  return response.json() as Promise<any>;
}
