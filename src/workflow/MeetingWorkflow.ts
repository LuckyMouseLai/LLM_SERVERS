import { LLMService } from './llm.js';
import { MeetingParameters, WorkflowResponse } from './types.js';

/**
 * 管理会议预订工作流的状态和逻辑
 */
export class MeetingWorkflow {
    private state: 'COLLECTING' | 'COMPLETED' | 'CANCELLED' = 'COLLECTING';
    private collectedParameters: MeetingParameters = {};
    // 定义必需参数
    private readonly requiredParameters: (keyof MeetingParameters)[] = ['attendees', 'date', 'time']; 
    private llmService: LLMService;

    constructor(llmService: LLMService, initialParams: Partial<MeetingParameters> = {}) {
        this.llmService = llmService;
        // 合并初始参数，进行初步验证或格式化（可选）
        this.collectedParameters = { ...initialParams };
        console.log("[MeetingWorkflow] Started with initial params:", this.collectedParameters);
    }

    /**
     * 处理用户在工作流中的输入
     * @param input 用户输入
     * @returns 工作流响应，包含下一步提示或完成结果
     */
    async processInput(input: string): Promise<WorkflowResponse> {
        if (this.state !== 'COLLECTING') {
            return { isCompleted: true, result: this.state === 'COMPLETED' ? this.collectedParameters : null };
        }

        // 1. 提取参数 (让 LLM 专注于缺失的参数)
        const missingParams = this.getMissingParameters();
        try {
            // 使用修改后的 extractParameters 方法，传入当前已收集的参数和缺失的参数
            const extractionResult = await this.llmService.extractParameters(
                input,
                'book_meeting', // 虚拟工具名
                this.collectedParameters, // 当前已收集的参数
                missingParams as string[] // 需要重点提取的参数
            );

            // 2. 合并新提取的参数
            for (const [key, value] of Object.entries(extractionResult.parameters)) {
                if (value !== undefined && value !== null && value !== '') {
                    // 特殊处理 attendees 数组
                    if (key === 'attendees') {
                        if (!this.collectedParameters.attendees) {
                            this.collectedParameters.attendees = [];
                        }
                        
                        // 确保值是数组
                        const attendeesArray = Array.isArray(value) ? value : [value];
                        
                        this.collectedParameters.attendees = [
                            ...this.collectedParameters.attendees,
                            ...attendeesArray
                        ];
                        // 去重
                        this.collectedParameters.attendees = [...new Set(this.collectedParameters.attendees)];
                    } else if (key in this.collectedParameters || this.isValidMeetingParameter(key)) { 
                        // 确保键是有效的会议参数
                        (this.collectedParameters as any)[key] = value;
                    }
                }
            }
            console.log("[MeetingWorkflow] Parameters after extraction:", this.collectedParameters);

        } catch (error) {
            console.error("[MeetingWorkflow] Error extracting parameters:", error);
            // 可以选择忽略错误继续，或者返回错误信息
             return { 
                 prompt: "我在尝试理解您的信息时遇到了点问题。我们能继续吗？请告诉我关于会议的细节。", 
                 isCompleted: false 
             };
        }

        // 3. 检查是否所有必需参数都已收集
        const stillMissingParams = this.getMissingParameters();
        if (stillMissingParams.length === 0) {
            // 4. 参数完整，工作流完成
            this.state = 'COMPLETED';
            console.log("[MeetingWorkflow] All parameters collected:", this.collectedParameters);
            return {
                prompt: `好的，会议信息已收集完整：\n参与者: ${this.collectedParameters.attendees?.join(', ') || '无'}\n日期: ${this.collectedParameters.date || '未指定'}\n时间: ${this.collectedParameters.time || '未指定'}\n时长: ${this.collectedParameters.duration || '未指定'}\n主题: ${this.collectedParameters.topic || '未指定'}\n确认预订吗？(回复 '确认' 或 '取消')`, // 可以加一步确认
                isCompleted: true, // 暂时标记完成，也可进入CONFIRMING状态
                result: this.collectedParameters
            };
        } else {
            // 5. 仍有参数缺失，生成追问提示
            const prompt = await this.generateParameterPrompt(stillMissingParams);
            console.log("[MeetingWorkflow] Missing params, generated prompt:", prompt);
            return {
                prompt: prompt,
                isCompleted: false
            };
        }
    }

    /**
     * 获取当前缺失的必需参数列表
     */
    private getMissingParameters(): (keyof MeetingParameters)[] {
        return this.requiredParameters.filter(param =>
            !(param in this.collectedParameters) ||
            this.collectedParameters[param] === undefined ||
            this.collectedParameters[param] === null ||
            (Array.isArray(this.collectedParameters[param]) && (this.collectedParameters[param] as any[]).length === 0) ||
            (typeof this.collectedParameters[param] === 'string' && (this.collectedParameters[param] as string).trim() === '')
        );
    }

    /**
     * 生成参数追问提示
     * @param missingParams 缺失的参数键列表
     */
    private async generateParameterPrompt(missingParams: (keyof MeetingParameters)[]): Promise<string> {
        // 使用 LLMService 的 generateParameterPrompt 方法
        try {
            const prompt = await this.llmService.generateParameterPrompt(
                'book_meeting',
                missingParams as string[]
            );
            
            // 可以在提示中包含已确认的信息，增加上下文
            const collectedInfo = Object.entries(this.collectedParameters)
                .filter(([_, value]) => value !== undefined && value !== null && 
                      (!Array.isArray(value) || value.length > 0) &&
                      (typeof value !== 'string' || value.trim() !== ''))
                .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                .join('\n');
                
            if (collectedInfo) {
                return `好的，我已经记录了：\n${collectedInfo}\n\n${prompt}`;
            }
            
            return prompt;
        } catch (error) {
            console.error("[MeetingWorkflow] Error generating prompt:", error);
            
            // 临时简单实现作为备选方案：
            const promptsMap: Record<keyof MeetingParameters, string> = {
                attendees: "还有谁需要参加会议？",
                date: "会议安排在哪一天？",
                time: "会议的具体时间是几点？",
                duration: "会议大约需要多长时间？",
                topic: "会议的主题是什么？"
            };
            
            // 优先问第一个缺失的
            const nextMissing = missingParams[0];
            return promptsMap[nextMissing] || `我还需要了解：${missingParams.join(', ')}。`;
        }
    }

    /**
     * 判断参数名是否是有效的会议参数
     * @param paramName 参数名
     * @returns 是否有效
     */
    private isValidMeetingParameter(paramName: string): paramName is keyof MeetingParameters {
        return ['attendees', 'date', 'time', 'duration', 'topic'].includes(paramName);
    }
} 