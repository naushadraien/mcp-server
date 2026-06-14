import type { LLMMessage, LLMTool } from "../types/common";

export async function callOllama(messages: LLMMessage[], tools: LLMTool[]) {
  const response = await fetch("http://localhost:11434/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // model: "qwen2.5:14b",
      model: "qwen2.5-coder:7b",
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
    throw new Error(`Ollama API error: ${err}`);
  }

  return response.json() as Promise<any>;
}
