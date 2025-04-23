export type Intent = 'mcp' | 'conversation';

export interface MCPTool {
    name: string;
    description: string;
    parameters: Record<string, {
        type: string;
        description: string;
        required: boolean;
    }>;
}

export interface ToolCall {
    name: string;
    parameters: Record<string, any>;
}

export interface IntentResult {
    intent: string;
    text: string;
    parameters: Record<string, any>;
    toolCall?: ToolCall;
    sessionId?: string;
}

export interface ParameterExtractionResult {
    toolName: string;
    parameters: Record<string, any>;
    missingParameters: string[];
}

export interface AgentResponse {
    type: 'conversation' | 'tool_execution' | 'parameter_request';
    content: string;
    parameters?: Record<string, any>;
    missingParameters?: string[];
    sessionId?: string;
} 