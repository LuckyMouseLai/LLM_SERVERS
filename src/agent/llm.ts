import { Intent, IntentResult, ParameterExtractionResult, MCPTool } from './types.js';
import { fetch } from 'undici';

interface SiliconFlowConfig {
    apiKey: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    frequencyPenalty?: number;
    n?: number;
}

interface ToolParameter {
    type: string;
    description?: string;
    required?: boolean;
}

export class LLMService {
    private config: SiliconFlowConfig;
    private tools: any[];

    constructor(tools: any[], config?: Partial<SiliconFlowConfig>) {
        this.tools = tools;
        this.config = {
            apiKey: 'sk-rygdiwcigbccnoihlbnviehiqsutldlkrcmmodrjnwgforbf',
            model: 'Qwen/Qwen2.5-7B-Instruct',
            temperature: 0.7,
            maxTokens: 512,
            topP: 0.7,
            topK: 50,
            frequencyPenalty: 0.5,
            n: 1,
            ...config
        };
    }

    private async callSiliconFlow(messages: any[], tools?: any[]): Promise<any> {
        console.log("messages: ", messages);
        console.log("tools: ", tools);
        const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.model,
                messages: messages,
                tools: tools,
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens,
                top_p: this.config.topP,
                top_k: this.config.topK,
                frequency_penalty: this.config.frequencyPenalty,
                n: this.config.n,
                response_format: { "type": "text" },
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`硅基流动API错误: ${response.statusText}`);
        }

        return await response.json();
    }

    async chat(input: string, tools: any[] = []): Promise<IntentResult> {
        const systemPrompt = `你是一个人工智能小助手。`;
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: input }
        ];
        let response;
        if (tools.length > 0) {
            response = await this.callSiliconFlow(messages, tools);
        }
        else {
            response = await this.callSiliconFlow(messages);
        }
        const responseMessage = response.choices[0].message;
        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
            for (const toolCall of responseMessage.tool_calls) {
                const toolName = toolCall.function.name;
                const toolArgs = JSON.parse(toolCall.function.arguments);
                console.log("toolname: ", toolName, " args: ", toolArgs);
                return {
                    intent: toolName,
                    text: "",
                    parameters: toolArgs
                };
            }
        }
        const result = response.choices[0].message.content;
        return {
            intent: "chat",
            text: result,
            parameters: {}
        };
        
    }

    async classifyIntent(input: string): Promise<IntentResult> {
        const systemPrompt = `你是一个人工智能小助手。`;
        // 获取所有工具名称
        const toolNames = this.tools.map(tool => tool.name);
        console.log("所有可用工具名称:", toolNames);

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: input }
        ];

        try {
            const tools = [
                {
                    type: "function",
                    function: {
                        name: "get_function",
                        description: "获取用户想使用的工具",
                        parameters: {
                            type: "string",
                            description: "工具名称",
                            enum: toolNames // 使用实际的工具名称列表
                        }
                    }
                }
            ];
            const response = await this.callSiliconFlow(messages, tools);
            const responseMessage = response.choices[0].message;
            if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
                for (const toolCall of responseMessage.tool_calls) {
                    const toolName = toolCall.function.name;
                    const toolArgs = JSON.parse(toolCall.function.arguments);
                    console.log("toolname: ", toolName, " args: ", toolArgs);
                }
            }
            const result = responseMessage.content;
            
            console.log("input: ", JSON.stringify(input, null, 2));
            console.log("result: ", result);

            return {
                intent: "chat",
                text: "fjeklgw",
                parameters: {}
            };
        } catch (error) {
            console.error('意图分类失败:', error);
            // 如果API调用失败，回退到简单的规则匹配
            const hasToolMention = toolNames.some(name => 
                input.toLowerCase().includes(name.toLowerCase())
            );
            return {
                intent: hasToolMention ? 'mcp' : 'conversation',
                text: hasToolMention ? "检测到工具调用" : "普通对话",
                parameters: {},
            };
        }
    }

    async extractParameters(input: string, toolName: string): Promise<ParameterExtractionResult> {
        const tool = this.tools.find(t => t.name.toLowerCase() === toolName.toLowerCase());
        if (!tool) {
            throw new Error(`Tool ${toolName} not found`);
        }

        // 准备工具定义
        const toolDefinitions = [{
            type: "function",
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.inputSchema
            }
        }];

        const systemPrompt = `你是一个参数提取助手。请从用户输入中提取工具所需的参数。
工具信息：
${JSON.stringify(tool, null, 2)}

请以JSON格式返回，格式如下：
{
    "parameters": {
        "参数名": "参数值"
    },
    "missingParameters": ["缺失的参数名"]
}`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: input }
        ];

        try {
            const response = await this.callSiliconFlow(messages, toolDefinitions);
            const result = JSON.parse(response.choices[0].message.content);
            return {
                toolName,
                parameters: result.parameters || {},
                missingParameters: result.missingParameters || []
            };
        } catch (error) {
            console.error('参数提取失败:', error);
            // 如果API调用失败，回退到简单的规则匹配
            const parameters: Record<string, any> = {};
            const missingParameters: string[] = [];

            if (tool.inputSchema?.properties) {
                for (const [paramName, paramInfo] of Object.entries(tool.inputSchema.properties)) {
                    const typedParamInfo = paramInfo as ToolParameter;
                    const paramPattern = new RegExp(`${paramName}:\\s*([^\\s]+)`, 'i');
                    const match = input.match(paramPattern);
                    
                    if (match) {
                        parameters[paramName] = match[1];
                    } else if (typedParamInfo.required) {
                        missingParameters.push(paramName);
                    }
                }
            }

            return {
                toolName,
                parameters,
                missingParameters
            };
        }
    }
} 