import { callOllama } from "../services/ollama.service";
import type {
  LLMMessage,
  LLMProvider,
  LLMResponse,
  LLMTool,
  ProviderFormat,
} from "../types/common";

export class OllamaProvider implements LLMProvider {
  format: ProviderFormat = "openai";

  async chat({
    messages,
    tools,
  }: {
    messages: LLMMessage[];
    tools: LLMTool[];
  }): Promise<LLMResponse> {
    const res = await callOllama(messages, tools);
    const msg = res.choices?.[0]?.message;

    const toolCalls = msg?.tool_calls?.map((t: any) => ({
      id: t.id,
      name: t.function.name,
      input: JSON.parse(t.function.arguments),
    }));

    if (toolCalls?.length) {
      return {
        type: "tool_use",
        toolCalls,
        text: msg.content,
        rawToolCalls: msg.tool_calls,
      };
    }
    return { type: "end", text: msg.content };
  }
}
