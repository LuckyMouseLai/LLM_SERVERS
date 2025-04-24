import { fetch } from 'undici';

// 添加缺失的类型定义
interface IntentResult {
    intent: string;
    text: string;
    parameters: Record<string, any>;
}

interface ParameterExtractionResult {
    toolName: string;
    parameters: Record<string, any>;
    missingParameters: string[];
    needMoreParams?: boolean;
}

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

// 预定义会议预订工具
const BOOKING_TOOL = {
    name: 'book_meeting',
    description: '预订会议，管理会议相关信息',
    inputSchema: {
        type: 'object',
        properties: {
            attendees: {
                type: 'array',
                description: '参会人员列表',
                items: {
                    type: 'string'
                },
                required: true
            },
            date: {
                type: 'string',
                description: '会议日期，格式为YYYY-MM-DD',
                required: true
            },
            time: {
                type: 'string',
                description: '会议时间，格式为HH:MM',
                required: true
            },
            duration: {
                type: 'string',
                description: '会议时长，如"30分钟"、"1小时"',
                required: false
            },
            topic: {
                type: 'string',
                description: '会议主题',
                required: false
            }
        },
        required: ['attendees', 'date', 'time']
    }
};

export class LLMService {
    private config: SiliconFlowConfig;
    private tools: any[];

    constructor(tools: any[] = [], config?: Partial<SiliconFlowConfig>) {
        // 确保至少有会议预订工具
        if (tools.length === 0 || !tools.some(t => t.name === 'book_meeting')) {
            this.tools = [...tools, BOOKING_TOOL];
        } else {
            this.tools = tools;
        }
        
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

    async extractParameters(
        input: string,
        toolName: string,
        collectedParams: Record<string, any> = {},
        missingParams: string[] = []
    ): Promise<ParameterExtractionResult> {
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

        // 构建提示，包含已收集的参数和缺失的参数
        let collectedParamsText = '';
        if (Object.keys(collectedParams).length > 0) {
            collectedParamsText = `已收集的参数:\n${
                Object.entries(collectedParams)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('\n')
            }\n\n`;
        }

        let missingParamsText = '';
        if (missingParams.length > 0) {
            missingParamsText = `需要重点提取的参数:\n${missingParams.join(', ')}\n\n`;
        }

        const systemPrompt = `你是一个参数提取助手。请从用户输入中提取工具所需的参数。
工具信息：
${JSON.stringify(tool, null, 2)}

${collectedParamsText}
${missingParamsText}

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
            
            // 合并已收集的参数和新提取的参数
            const mergedParams = { ...collectedParams, ...result.parameters };
            
            return {
                toolName,
                parameters: mergedParams || {},
                missingParameters: result.missingParameters || [],
                needMoreParams: (result.missingParameters || []).length > 0
            };
        } catch (error) {
            console.error('参数提取失败:', error);
            // 如果API调用失败，回退到简单的规则匹配
            const parameters: Record<string, any> = { ...collectedParams };
            const stillMissingParameters: string[] = [...missingParams];

            if (tool.inputSchema?.properties) {
                for (const [paramName, paramInfo] of Object.entries(tool.inputSchema.properties)) {
                    if (parameters[paramName]) continue; // 如果已经有参数值，跳过
                    
                    const typedParamInfo = paramInfo as ToolParameter;
                    const paramPattern = new RegExp(`${paramName}:\\s*([^\\s]+)`, 'i');
                    const match = input.match(paramPattern);
                    
                    if (match) {
                        parameters[paramName] = match[1];
                        // 如果成功提取，从缺失参数列表中移除
                        const index = stillMissingParameters.indexOf(paramName);
                        if (index > -1) {
                            stillMissingParameters.splice(index, 1);
                        }
                    } else if (typedParamInfo.required && !stillMissingParameters.includes(paramName)) {
                        stillMissingParameters.push(paramName);
                    }
                }
            }

            return {
                toolName,
                parameters,
                missingParameters: stillMissingParameters,
                needMoreParams: stillMissingParameters.length > 0
            };
        }
    }

    /**
     * 生成参数追问提示
     * @param toolName 工具名称
     * @param missingParams 缺失参数列表
     * @returns 自然语言提示
     */
    async generateParameterPrompt(toolName: string, missingParams: string[]): Promise<string> {
        const systemPrompt = `为工具 "${toolName}" 生成一个自然语言提示，
请用户提供以下缺失的参数: ${missingParams.join(', ')}。
输出应该是一个友好的提示，向用户解释我们需要这些参数来完成他们的请求。`;

        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: "生成参数提示" }
        ];

        try {
            const response = await this.callSiliconFlow(messages);
            
            if (!response) {
                return this.fallbackParameterPrompt(toolName, missingParams);
            }

            return response.choices[0].message.content || this.fallbackParameterPrompt(toolName, missingParams);
        } catch (error) {
            console.error('Generate parameter prompt error:', error);
            return this.fallbackParameterPrompt(toolName, missingParams);
        }
    }
    
    /**
     * 参数提示回退方法
     * @param toolName 工具名称
     * @param missingParams 缺失参数列表
     * @returns 简单的参数提示
     */
    private fallbackParameterPrompt(toolName: string, missingParams: string[]): string {
        return `请提供以下参数以使用 "${toolName}" 工具: ${missingParams.join(', ')}`;
    }
} 