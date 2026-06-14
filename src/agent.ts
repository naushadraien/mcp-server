import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as path from "path";
import * as readline from "readline";
import { fileURLToPath } from "url";
import { envs } from "./config/envs";
import { providers } from "./providers";
import type { LLMMessage, LLMProvider, LLMTool } from "./types/common";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.resolve(__dirname, "./mcp-server/index.ts");

// ─── Start MCP Client ─────────────────────────────────────────────────────────
async function startMcpClient() {
  const transport = new StdioClientTransport({
    command: "bun",
    args: ["run", SERVER_PATH],
    env: { ...process.env } as Record<string, string>,
  });

  const client = new Client({ name: "standalone-agent", version: "1.0.0" });
  await client.connect(transport);
  return client;
}

// ─── Agent Loop ───────────────────────────────────────────────────────────────
async function runAgent(
  mcpClient: Client,
  userMessage: string,
  history: LLMMessage[],
  llm: LLMProvider,
) {
  const { tools } = await mcpClient.listTools();

  const llmTools: LLMTool[] = tools.map((t) => ({
    name: t.name,
    description: t.description ?? "",
    input_schema: t.inputSchema,
  }));

  const messages: LLMMessage[] = [
    ...history,
    { role: "user", content: userMessage },
  ];

  const MAX_ITERATIONS = 5;
  let iterations = 0;
  const isOpenAI = llm.format === "openai"; // ← check provider format

  while (true) {
    if (iterations >= MAX_ITERATIONS) {
      console.log("⚠️  Max iterations reached, stopping.");
      return messages;
    }
    iterations++;

    const response = await llm.chat({ messages, tools: llmTools });

    // ─── Final answer ────────────────────────────────────────────────────────
    if (response.type === "end") {
      console.log(response.text);
      return messages;
    }

    // ─── Tool use ────────────────────────────────────────────────────────────
    if (response.type === "tool_use") {
      if (isOpenAI) {
        // OpenAI format — save assistant message with raw tool_calls first
        messages.push({
          role: "assistant",
          content: response.text ?? null,
          tool_calls: (response as any).rawToolCalls,
        });

        // Each tool result is its own "tool" role message
        for (const tool of response.toolCalls ?? []) {
          console.log(
            `🔧 [${iterations}/${MAX_ITERATIONS}] Calling: ${tool.name}`,
          );

          const result = await mcpClient.callTool({
            name: tool.name,
            arguments: tool.input,
          });

          const resultText =
            (result.content as any[])?.[0]?.text ?? "No result";

          messages.push({
            role: "tool",
            tool_call_id: tool.id, // ← OpenAI uses tool_call_id
            content: resultText, // ← plain string
          });
        }
      } else {
        // Anthropic format — all results in one user message as content array
        const toolResults: any[] = [];

        for (const tool of response.toolCalls ?? []) {
          console.log(
            `🔧 [${iterations}/${MAX_ITERATIONS}] Calling: ${tool.name}`,
          );

          const result = await mcpClient.callTool({
            name: tool.name,
            arguments: tool.input,
          });

          const resultText =
            (result.content as any[])?.[0]?.text ?? "No result";

          toolResults.push({
            type: "tool_result",
            tool_use_id: tool.id, // ← Anthropic uses tool_use_id
            content: resultText,
          });
        }

        messages.push({ role: "user", content: toolResults });
      }

      continue;
    }

    // ─── Text (intermediate) ─────────────────────────────────────────────────
    if (response.type === "text") {
      messages.push({ role: "assistant", content: response.text });
    }
  }
}

const llm = providers[envs.PROVIDER];

// ─── Interactive CLI ──────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 Starting MCP dev-tools agent...");

  const mcpClient = await startMcpClient();
  const { tools } = await mcpClient.listTools();

  console.log(`✅ MCP server connected. Tools available:`);
  tools.forEach((t) => console.log(`   • ${t.name} — ${t.description}`));
  console.log(`🤖 Provider: ${envs.PROVIDER} (${llm.format} format)`);
  console.log('\nType your message (or "exit" to quit)\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let history: LLMMessage[] = [];

  const ask = () => {
    rl.question("You: ", async (input) => {
      const trimmed = input.trim();
      if (!trimmed) return ask();
      if (trimmed.toLowerCase() === "exit") {
        console.log("👋 Goodbye!");
        await mcpClient.close();
        rl.close();
        return;
      }

      try {
        history = await runAgent(mcpClient, input, history, llm);
      } catch (err: any) {
        console.error("❌ Error:", err.message);
      }

      ask();
    });
  };

  ask();
}

main().catch(console.error);
