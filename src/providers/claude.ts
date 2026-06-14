import { callClaude } from "../services/claude.service";
import type {
  LLMMessage,
  LLMProvider,
  LLMResponse,
  LLMTool,
  ProviderFormat,
} from "../types/common";

export class ClaudeProvider implements LLMProvider {
  format: ProviderFormat = "anthropic";

  async chat({
    messages,
    tools,
  }: {
    messages: LLMMessage[];
    tools: LLMTool[];
  }): Promise<LLMResponse> {
    const res = await callClaude(messages, tools);
    const content = res.content;

    const toolCalls = content
      .filter((b: any) => b.type === "tool_use")
      .map((t: any) => ({ id: t.id, name: t.name, input: t.input }));

    const textBlock = content.find((b: any) => b.type === "text");

    if (res.stop_reason === "end_turn") {
      return { type: "end", text: textBlock?.text ?? "" };
    }
    if (res.stop_reason === "tool_use") {
      return { type: "tool_use", toolCalls, text: textBlock?.text };
    }
    return { type: "text", text: textBlock?.text ?? "" };
  }
}
