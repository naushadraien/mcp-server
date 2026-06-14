export type LLMTool = {
  name: string;
  description: string;
  input_schema: any;
};

export type LLMMessage = {
  role: "user" | "assistant" | "system" | "tool";
  content: any;
  tool_call_id?: string;
  tool_calls?: any[];
};

export type LLMResponse = {
  type: "text" | "tool_use" | "end";
  text?: string;
  toolCalls?: {
    id: string;
    name: string;
    input: any;
  }[];
  rawToolCalls?: any[];
};

export type ProviderFormat = "anthropic" | "openai";

export interface LLMProvider {
  format: ProviderFormat;
  chat(params: {
    messages: LLMMessage[];
    tools: LLMTool[];
  }): Promise<LLMResponse>;
}
