import express, { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { getCurrentTimeTool } from './tools/get-current-time.js';
import { calculatorTool } from './tools/calculator.js';
import { thirdPartyTool } from './tools/third-party.js';

// 创建MCP服务器实例
const server = new McpServer({
  name: "mcp-server",
  version: "1.0.0"
});

// 注册MCP工具
server.resource = {
  get_current_time: getCurrentTimeTool,
  calculator: calculatorTool,
  third_party_example: thirdPartyTool
};

const app = express();
app.use(express.json());

// 存储会话ID到传输对象的映射
const transports: {[sessionId: string]: SSEServerTransport} = {};

// SSE连接端点
app.get("/sse", async (_: Request, res: Response) => {
  const transport = new SSEServerTransport('/messages', res);
  transports[transport.sessionId] = transport;
  
  // 连接关闭时清理
  res.on("close", () => {
    delete transports[transport.sessionId];
  });
  
  await server.connect(transport);
});

// 消息处理端点
app.post("/messages", async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports[sessionId];
  
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send('未找到对应会话的传输对象');
  }
});

// 获取工具列表端点
app.get("/tools", (_: Request, res: Response) => {
  // 将工具对象转换为数组格式
  const tools = Object.entries(server.resource).map(([name, tool]) => {
    const toolObj = tool as Record<string, any>;
    return {
      name,
      ...toolObj
    };
  });
  res.json(tools);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`MCP服务器运行在 http://localhost:${PORT}`);
}); 