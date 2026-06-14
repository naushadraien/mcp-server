import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { exec } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";
import { promisify } from "util";
import { z } from "zod";
import { logger } from "../utils/logger";

const execAsync = promisify(exec);

const server = new McpServer({
  name: "dev-tools-server",
  version: "1.0.0",
});

server.registerTool(
  "read_file",
  {
    title: "Read File",
    description: "Read the contents of a file from disk",
    inputSchema: {
      path: z.string().describe("Absolute or relative path to the file"),
    },
  },
  async ({ path: filePath }) => {
    logger("read_file", "called", { path: filePath });
    try {
      const absolutePath = path.resolve(filePath);
      const content = await fs.readFile(absolutePath, "utf-8");
      return {
        content: [
          { type: "text", text: `File: ${absolutePath}\n\n${content}` },
        ],
      };
    } catch (err: any) {
      return {
        content: [{ type: "text", text: `Error reading file: ${err.message}` }],
      };
    }
  },
);

server.registerTool(
  "write_file",
  {
    title: "Write File",
    description: "Write or overwrite content to a file on disk",
    inputSchema: {
      path: z.string().describe("Path to the file to write"),
      content: z.string().describe("Content to write into the file"),
    },
  },
  async ({ path: filePath, content }) => {
    logger("write_file", "called", { path: filePath });
    try {
      const absolutePath = path.resolve(filePath);
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, content, "utf-8");
      return {
        content: [
          { type: "text", text: `Successfully wrote to ${absolutePath}` },
        ],
      };
    } catch (err: any) {
      return {
        content: [{ type: "text", text: `Error writing file: ${err.message}` }],
      };
    }
  },
);

server.registerTool(
  "list_directory",
  {
    title: "List Directory",
    description: "List all files and folders in a directory",
    inputSchema: {
      path: z.string().describe("Path to the directory"),
      recursive: z
        .boolean()
        .optional()
        .default(false)
        .describe("List recursively"),
    },
  },
  async ({ path: dirPath, recursive }) => {
    logger("list_directory", "called", { path: dirPath, recursive });
    try {
      const absolutePath = path.resolve(dirPath);

      async function listDir(dir: string, indent = ""): Promise<string> {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        let result = "";
        for (const entry of entries) {
          if (entry.name === "node_modules" || entry.name === ".git") continue;
          result += `${indent}${entry.isDirectory() ? "📁" : "📄"} ${entry.name}\n`;
          if (recursive && entry.isDirectory()) {
            result += await listDir(path.join(dir, entry.name), indent + "  ");
          }
        }
        return result;
      }

      const listing = await listDir(absolutePath);
      return {
        content: [
          { type: "text", text: `Directory: ${absolutePath}\n\n${listing}` },
        ],
      };
    } catch (err: any) {
      return {
        content: [
          { type: "text", text: `Error listing directory: ${err.message}` },
        ],
      };
    }
  },
);

server.registerTool(
  "run_command",
  {
    title: "Run Terminal Command",
    description: "Execute a shell/terminal command and return the output",
    inputSchema: {
      command: z.string().describe("The shell command to run"),
      cwd: z
        .string()
        .optional()
        .describe("Working directory to run the command in"),
    },
  },
  async ({ command, cwd }) => {
    logger("run_command", "called", { command, cwd });
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: cwd ? path.resolve(cwd) : process.cwd(),
        timeout: 30000,
      });
      const output = [
        stdout && `STDOUT:\n${stdout}`,
        stderr && `STDERR:\n${stderr}`,
      ]
        .filter(Boolean)
        .join("\n");
      return {
        content: [
          {
            type: "text",
            text: output || "Command ran successfully (no output)",
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [
          {
            type: "text",
            text: `Command failed:\n${err.message}\n${err.stderr || ""}`,
          },
        ],
      };
    }
  },
);

server.registerTool(
  "search_in_files",
  {
    title: "Search in Files",
    description: "Search for a text/pattern across files in a directory",
    inputSchema: {
      directory: z.string().describe("Directory to search in"),
      pattern: z.string().describe("Text or regex pattern to search for"),
      extension: z
        .string()
        .optional()
        .describe("File extension filter e.g. .ts .js .tsx"),
    },
  },
  async ({ directory, pattern, extension }) => {
    logger("search_in_files", "called", { directory, pattern, extension });
    try {
      const absolutePath = path.resolve(directory);
      const results: string[] = [];

      async function searchDir(dir: string) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name === "node_modules" || entry.name === ".git") continue;
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await searchDir(fullPath);
          } else {
            if (extension && !entry.name.endsWith(extension)) continue;
            const content = await fs
              .readFile(fullPath, "utf-8")
              .catch(() => "");
            const lines = content.split("\n");
            const regex = new RegExp(pattern, "gi");
            lines.forEach((line, idx) => {
              if (regex.test(line)) {
                results.push(`${fullPath}:${idx + 1}  →  ${line.trim()}`);
              }
            });
          }
        }
      }

      await searchDir(absolutePath);
      const output =
        results.length > 0
          ? results.join("\n")
          : `No matches found for "${pattern}"`;
      return { content: [{ type: "text", text: output }] };
    } catch (err: any) {
      return {
        content: [{ type: "text", text: `Search error: ${err.message}` }],
      };
    }
  },
);

server.registerTool(
  "create_directory",
  {
    title: "Create Directory",
    description: "Create a new directory (including nested directories)",
    inputSchema: {
      path: z.string().describe("Path of the directory to create"),
    },
  },
  async ({ path: dirPath }) => {
    logger("create_directory", "called", { path: dirPath });
    try {
      const absolutePath = path.resolve(dirPath);
      await fs.mkdir(absolutePath, { recursive: true });
      return {
        content: [{ type: "text", text: `Created directory: ${absolutePath}` }],
      };
    } catch (err: any) {
      return {
        content: [
          { type: "text", text: `Error creating directory: ${err.message}` },
        ],
      };
    }
  },
);

server.registerTool(
  "delete_file",
  {
    title: "Delete File",
    description: "Delete a file from disk",
    inputSchema: {
      path: z.string().describe("Path to the file to delete"),
    },
  },
  async ({ path: filePath }) => {
    logger("delete_file", "called", { path: filePath });
    try {
      const absolutePath = path.resolve(filePath);
      await fs.unlink(absolutePath);
      return { content: [{ type: "text", text: `Deleted: ${absolutePath}` }] };
    } catch (err: any) {
      return {
        content: [
          { type: "text", text: `Error deleting file: ${err.message}` },
        ],
      };
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
logger("server", "MCP dev-tools-server started ✓");
