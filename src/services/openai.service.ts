import type { LLMMessage, LLMTool } from "../types/common";
import { envs } from "../config/envs";

export async function callOpenAI(messages: LLMMessage[], tools: LLMTool[]) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${envs.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", // cheapest GPT with good tool use
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
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${err}`);
  }

  return response.json() as Promise<any>;
}
