export function logger(tool: string, event: string, detail?: any) {
  const timestamp =
    new Date().toISOString().split("T")[1]?.split(".")[0] ??
    new Date().toLocaleTimeString();
  const detailStr = detail !== undefined ? ` → ${JSON.stringify(detail)}` : "";
  process.stderr.write(`[${timestamp}] [MCP:${tool}] ${event}${detailStr}\n`);
}
