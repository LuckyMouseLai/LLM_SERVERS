import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export class MCPClient {
    private client: Client | null = null;
    private isConnected = false;
    private tools: any[] = [];

    constructor(private baseUrl: string) {}

    async initialize(): Promise<void> {
        if (this.isConnected && this.client) {
            console.log("MCP客户端已经连接");
            return;
        }

        try {
            console.log("正在初始化MCP客户端...");
            
            // 创建新的MCP客户端
            this.client = new Client({ 
                name: "mcp-agent-client", 
                version: "1.0.0" 
            });
            
            // 初始化SSE传输
            const transport = new SSEClientTransport(new URL(this.baseUrl));
            // 使用stdio传输
            const stdioTransport = new StdioClientTransport({
                command: 'node',
                args: ['./dist/server/index.js'],
            });

            // 连接到服务器
            this.client.connect(transport);
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 获取可用工具列表
            const toolsResult = await this.client.listTools();
            
            if (!toolsResult || !toolsResult.tools || toolsResult.tools.length === 0) {
                throw new Error("未能获取到可用工具列表");
            }
            
            this.tools = toolsResult.tools;
            console.log(`已连接到MCP服务器，获取到 ${this.tools.length} 个可用工具`);
            console.log('工具列表详情:', JSON.stringify(this.tools, null, 2));
            this.isConnected = true;
        } catch (error) {
            console.error("MCP客户端初始化失败:", error);
            this.isConnected = false;
            throw error;
        }
    }

    getTools(): any[] {
        return this.tools;
    }

    async executeTool(toolName: string, parameters: Record<string, any>): Promise<any> {
        if (!this.client || !this.isConnected) {
            throw new Error("MCP客户端未连接");
        }

        try {
            console.log(`正在调用工具: ${toolName}，参数:`, JSON.stringify(parameters, null, 2));
            
            const result = await this.client.callTool({
                name: toolName,
                arguments: parameters
            });
            
            console.log(`工具 ${toolName} 调用成功:`, JSON.stringify(result, null, 2));
            return result;
        } catch (error) {
            console.error(`工具调用失败: ${toolName}`, error);
            throw error;
        }
    }
} 