import { MCPClient } from './mcp.js';
import { LLMService } from './llm.js';
import { AgentResponse } from './types.js';
import { v4 as uuidv4 } from 'uuid';
export class Agent {
    
    private llmService!: LLMService;
    private context: string = "";
    private tools: any[] = [];
    private handoffs: any[] = [];

    constructor(mcpBaseUrl: string) {
        this.mcpClient = new MCPClient(mcpBaseUrl);
    }

    async initialize(): Promise<void> {
        await this.mcpClient.initialize();
        this.llmService = new LLMService(this.mcpClient.getTools());
    }

    async processInput(input: string): Promise<AgentResponse> {
        // 1. 分类意图
        const chatResult = await this.llmService.chat(input);
        if (chatResult.intent === 'chat') {
            return {
                type: 'conversation',
                content: chatResult.text
            };
        }

        
        

        // 2. 如果意图是对话，则返回对话内容
        // 3. 如果意图是工具，则提取工具名称和参数
        // 4. 执行工具
        // 5. 返回工具执行结果
        // 6. 如果意图是退出，则返回退出消息
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

