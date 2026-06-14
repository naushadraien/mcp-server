import { ClaudeProvider } from "./claude";
import { DeepSeekProvider } from "./deepseek";
import { GeminiProvider } from "./gemini";
import { GroqProvider } from "./groq";
import { OllamaProvider } from "./ollama";
import { OpenAIProvider } from "./openai";
import { OpenRouterProvider } from "./openrouter";

export const providers = {
  claude: new ClaudeProvider(),
  groq: new GroqProvider(),
  ollama: new OllamaProvider(),
  openai: new OpenAIProvider(),
  openrouter: new OpenRouterProvider(),
  deepseek: new DeepSeekProvider(),
  gemini: new GeminiProvider(),
};
