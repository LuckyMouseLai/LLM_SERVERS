import { MCPClient } from './mcp.js';
import { LLMService } from './llm.js';
import { AgentResponse } from './types.js';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

export class Agent {
    private llmService!: LLMService;
    private context: string = "";
    private tools: any[] = [];
    private handoffs: any[] = [];
    private mcpClient!: MCPClient;

    constructor(mcpConfigPath: string) {
        // 解析配置文件路径
        const resolvedPath = path.resolve(mcpConfigPath);
        this.mcpClient = new MCPClient(resolvedPath);
    }

    async initialize(): Promise<void> {
        await this.mcpClient.initialize();
        this.llmService = new LLMService(this.mcpClient.getTools());
    }

    async processInput(input: string): Promise<AgentResponse> {
        // 1. 分类意图
        const intentResult = await this.llmService.classifyIntent(input);

        if (intentResult.intent === 'conversation') {
            return {
                type: 'conversation',
                content: `我理解您想进行对话。${input}`
            };
        }

        // 如果有工具调用信息
        if (intentResult.toolCall) {
            const { name, parameters } = intentResult.toolCall;
            
            try {
                const result = await this.mcpClient.executeTool(name, parameters);
                return {
                    type: 'tool_execution',
                    content: `工具执行成功：${JSON.stringify(result)}`,
                    parameters: parameters
                };
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : '未知错误';
                return {
                    type: 'conversation',
                    content: `执行工具时出错：${errorMessage}`
                };
            }
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

