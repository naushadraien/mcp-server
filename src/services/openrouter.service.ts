import type { LLMMessage, LLMTool } from "../types/common";
import { envs } from "../config/envs";

export async function callOpenRouter(messages: LLMMessage[], tools: LLMTool[]) {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${envs.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "http://localhost", // required by OpenRouter
        "X-Title": "MCP Agent", // optional, shows in their dashboard
      },
      body: JSON.stringify({
        model: "openrouter/free",
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
    throw new Error(`OpenRouter API error: ${err}`);
  }

  return response.json() as Promise<any>;
}
