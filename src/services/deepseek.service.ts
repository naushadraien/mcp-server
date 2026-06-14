import { envs } from "../config/envs";
import type { LLMMessage, LLMTool } from "../types/common";

export async function callDeepSeek(messages: LLMMessage[], tools: LLMTool[]) {
  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${envs.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
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
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek API error: ${err}`);
  }

  return response.json() as Promise<any>;
}
