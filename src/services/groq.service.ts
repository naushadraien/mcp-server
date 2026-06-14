import { envs } from "../config/envs";
import type { LLMMessage, LLMTool } from "../types/common";

export async function callGroq(messages: LLMMessage[], tools: LLMTool[]) {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${envs.GROQ_API_KEY!}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // free, fast, smart
        max_tokens: 4096,
        tools: tools.map((t) => ({
          type: "function",
          function: {
            name: t.name,
            description: t.description,
            parameters: t.input_schema,
          },
        })),
        messages,
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${err}`);
  }

  return response.json() as Promise<any>;
}
