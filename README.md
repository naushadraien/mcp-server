# MCP Dev-Tools Agent

A local AI agent system built with the Model Context Protocol (MCP) that gives any LLM real access to your filesystem, terminal, and codebase. Works as both a standalone terminal agent and a Continue.dev integration in VS Code.

## What It Does

- Connects any LLM (Claude, Groq, OpenAI, Gemini, OpenRouter, Ollama) to your local machine via MCP
- Gives the AI real tools to read/write files, run commands, and search your codebase
- Works as a terminal agent (`bun dev`) or as a Continue.dev MCP server in VS Code
- Fully provider-agnostic — switch models by changing one `.env` variable

## Project Structure

```
mcp-server/
├── src/
│   ├── mcp-server/
│   │   └── index.ts          # MCP server with 7 tools
│   ├── providers/
│   │   ├── index.ts          # Provider registry
│   │   ├── claude.ts         # Anthropic Claude
│   │   ├── groq.ts           # Groq (Llama)
│   │   ├── openai.ts         # OpenAI (GPT)
│   │   ├── openrouter.ts     # OpenRouter
│   │   ├── ollama.ts         # Ollama (local)
│   │   └── gemini.ts         # Google Gemini
│   ├── services/
│   │   ├── claude.service.ts
│   │   ├── groq.service.ts
│   │   ├── openai.service.ts
│   │   ├── openrouter.service.ts
│   │   ├── ollama.service.ts
│   │   └── gemini.service.ts
│   ├── config/
│   │   └── envs.ts           # Environment config
│   ├── types/
│   │   └── common.ts         # Shared types
│   └── agent.ts              # Standalone terminal agent
├── .env                      # API keys (never commit)
├── package.json
└── tsconfig.json
```

## Installation

```bash
git clone <your-repo>
cd mcp-server
bun install
```

## Environment Setup

Create a `.env` file in the project root:

```bash
# Choose your provider
PROVIDER=groq   # groq | claude | openai | openrouter | ollama | gemini

# Add the API key for your chosen provider
GROQ_API_KEY=your_groq_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENAI_API_KEY=your_openai_key_here
OPENROUTER_API_KEY=your_openrouter_key_here
GEMINI_API_KEY=your_gemini_key_here
# Ollama needs no API key — runs locally
```

## Running the Agent

```bash
bun dev
```

This starts an interactive terminal agent. Type your message and the AI will use MCP tools to act on your local machine.

```
🚀 Starting MCP dev-tools agent...
✅ MCP server connected. Tools available:
   • read_file
   • write_file
   • list_directory
   • run_command
   • search_in_files
   • create_directory
   • delete_file

You: read C:/Projects/myapp/package.json and tell me the dependencies
🔧 [1/5] Calling: read_file
...
```

## Switching Providers

Just change `PROVIDER` in your `.env`:

```bash
PROVIDER=groq        # Groq Llama 3.3 — free 100k tokens/day
PROVIDER=claude      # Anthropic Claude — best quality
PROVIDER=openai      # OpenAI GPT-4o
PROVIDER=openrouter  # OpenRouter — access to many models
PROVIDER=gemini      # Google Gemini — free 1500 req/day
PROVIDER=ollama      # Local Ollama — free, no limits
```

## Available Tools

| Tool | Description |
|------|-------------|
| `read_file` | Read the contents of any file from disk |
| `write_file` | Write or overwrite content to a file |
| `list_directory` | List files and folders (supports recursive) |
| `run_command` | Execute any shell/terminal command |
| `search_in_files` | Search text/regex across your codebase |
| `create_directory` | Create new directories (including nested) |
| `delete_file` | Delete a file from disk |

## Example Prompts

```
# Read a file
read C:/Projects/myapp/package.json and show me all dependencies

# List project structure
list all files in C:/Projects/myapp/src recursively

# Search codebase
search for "TODO" in C:/Projects/myapp/src with extension .ts

# Run a command
run "npm run build" in C:/Projects/myapp

# Chain multiple tools
list all files in src, read index.ts and write a summary to SUMMARY.md

# Generate documentation
read all files in src and write a complete README.md
```

## Use with Continue.dev in VS Code

Add this to `~/.continue/config.yaml`:

```yaml
mcpServers:
  - name: dev-tools
    command: bun
    args:
      - run
      - C:/Projects/ai/mcp-server/src/mcp-server/index.ts
```

Continue will automatically start the MCP server when VS Code opens. Use **Agent mode** in Continue chat to trigger tool calls.

## Adding New Tools

Open `src/mcp-server/index.ts` and add a new `server.registerTool()` block:

```typescript
server.registerTool(
  "my_tool",                          // tool name
  {
    title: "My Tool",                 // human-readable title
    description: "What this tool does", // what the AI sees
    inputSchema: {
      param1: z.string().describe("Description of param1"),
      param2: z.number().optional().describe("Optional param"),
    },
  },
  async ({ param1, param2 }) => {
    // your code here — call APIs, query DB, anything
    const result = await doSomething(param1);
    return {
      content: [{ type: "text", text: result }],
    };
  }
);
```

Reload VS Code or restart `bun dev` and the new tool is immediately available.

## Provider API Links

| Provider | Free Tier | Sign Up |
|----------|-----------|---------|
| Groq | 100k tokens/day | console.groq.com |
| OpenRouter | 50 req/day | openrouter.ai |
| Gemini | 1500 req/day | aistudio.google.com |
| DeepSeek | Pay as you go (~$0.001/1k) | platform.deepseek.com |
| Ollama | Unlimited (local) | ollama.com |