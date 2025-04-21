import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
export interface InputSchema {
  type: 'object';

  properties?: unknown | null;
  [k: string]: unknown;
}
export interface CacheControlEphemeral {
  type: 'ephemeral';
}
export interface Tool {
  input_schema: InputSchema;

  name: string;

  cache_control?: CacheControlEphemeral | null;
  description?: string;
}
class MCPClient {
  private mcp: Client;
  private transport: StdioClientTransport | null = null;
  private tools: Tool[] = [];

  constructor() {
    // Initialize Anthropic client and MCP client
    this.mcp = new Client({ name: "mcp-client-cli", version: "1.0.0" });
  }

  async connectToServer(serverScriptPath: string) {
    /**
     * Connect to an MCP server
     *
     * @param serverScriptPath - Path to the server script (.py or .js)
     */
    try {
      // Determine script type and appropriate command
      const isJs = serverScriptPath.endsWith(".js");
      const isPy = serverScriptPath.endsWith(".py");
      if (!isJs && !isPy) {
        throw new Error("Server script must be a .js or .py file");
      }
      const command = isPy
        ? process.platform === "win32"
          ? "python"
          : "python3"
        : process.execPath;

      // Initialize transport and connect to server
      this.transport = new StdioClientTransport({
        command,
        args: [serverScriptPath],
      });
      this.mcp.connect(this.transport);

      // List available tools
      const toolsResult = await this.mcp.listTools();
      console.log("toolsResult: ", toolsResult);
      this.tools = toolsResult.tools.map((tool) => {
        return {
          name: tool.name,
          description: tool.description,
          input_schema: tool.inputSchema,
        };
      });
      console.log(
        "Connected to server with tools:",
        this.tools.map(({ name }) => name),
      );
      console.log(
        "输入大模型的tool提示词：", this.tools
      );
    } catch (e) {
      console.log("Failed to connect to MCP server: ", e);
      throw e;
    }
  }

  async processQuery(query: string) {
    console.log("processQuery: ", query); 
    const toolName = "calculator";
    const toolArgs = {
      a: 5, // 第一个数字
      b: 3, // 第二个数字
      operation: "add" // 运算类型
    } as { [x: string]: unknown } | undefined;
    try {
      const result = await this.mcp.callTool({
        name: toolName,
        arguments: toolArgs
      });
      console.log("tool result: ", result);
      return String(result);
    } catch (e) {
      console.log("tool error: ", e);
      return String(e);
    }
  }

  async chatLoop() {
    /**
     * Run an interactive chat loop using standard input/output
     */
    console.log("\nMCP Client Started!");
    console.log("Type your queries or 'quit' to exit.");

    process.stdin.setEncoding('utf8');
    process.stdout.write("\nQuery: ");

    process.stdin.on('data', async (data) => {
      const message = data.toString().trim();
      
      if (message.toLowerCase() === "quit") {
        process.stdin.end();
        return;
      }

      const response = await this.processQuery(message);
      console.log("\n" + response);
      process.stdout.write("\nQuery: ");
    });

    // 等待输入流结束
    await new Promise<void>((resolve) => {
      process.stdin.on('end', () => {
        resolve();
      });
    });
  }

  async cleanup() {
    /**
     * Clean up resources
     */
    await this.mcp.close();
  }
}

async function main() {
  if (process.argv.length < 3) {
    console.log("Usage: node build/index.js <path_to_server_script>");
    return;
  }
  const mcpClient = new MCPClient();
  try {
    await mcpClient.connectToServer(process.argv[2]);
    await mcpClient.chatLoop();
  } finally {
    await mcpClient.cleanup();
    process.exit(0);
  }
}

main();