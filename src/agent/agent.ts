import { MCPClient } from './mcp.js';
import { LLMService } from './llm.js';
import { AgentResponse } from './types.js';

export class Agent {
    private mcpClient: MCPClient;
    private llmService!: LLMService;

    constructor(mcpBaseUrl: string) {
        this.mcpClient = new MCPClient(mcpBaseUrl);
    }

    async initialize(): Promise<void> {
        await this.mcpClient.initialize();
        this.llmService = new LLMService(this.mcpClient.getTools());
    }

    async processInput(input: string): Promise<AgentResponse> {
        const intentResult = await this.llmService.classifyIntent(input);

        if (intentResult.intent === 'conversation') {
            return {
                type: 'conversation',
                content: `我理解您想进行对话。${input}`
            };
        }

        // 提取工具名称
        const toolNames = this.mcpClient.getTools().map(tool => tool.name.toLowerCase());
        const toolName = toolNames.find(name => input.toLowerCase().includes(name));

        if (!toolName) {
            return {
                type: 'conversation',
                content: '抱歉，我没有找到对应的工具。'
            };
        }

        const paramResult = await this.llmService.extractParameters(input, toolName);

        if (paramResult.missingParameters.length > 0) {
            return {
                type: 'parameter_request',
                content: `请提供以下参数：${paramResult.missingParameters.join(', ')}`,
                missingParameters: paramResult.missingParameters
            };
        }

        try {
            const result = await this.mcpClient.executeTool(toolName, paramResult.parameters);
            return {
                type: 'tool_execution',
                content: `工具执行成功：${JSON.stringify(result)}`,
                parameters: paramResult.parameters
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            return {
                type: 'conversation',
                content: `执行工具时出错：${errorMessage}`
            };
        }
    }
}


async function main() {
    const agent = new Agent('https://mcp.amap.com/sse?key=bec2c3f2768da638f5762106803e4866');
    await agent.initialize();

    // 对话场景
    const response1 = await agent.processInput('你好');
    console.log(response1.content); // 输出：我理解您想进行对话。你好

    // 工具执行场景
    console.log('----------------------');
    const response2 = await agent.processInput('使用search工具，关键词：typescript');
    console.log(response2.content);
    // 如果参数完整，会执行工具并返回结果
    // 如果参数不完整，会要求提供缺失的参数
  }
  
  main();
