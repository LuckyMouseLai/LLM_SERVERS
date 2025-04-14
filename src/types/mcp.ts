export interface MCPRequest {
  input: any;
}

export interface MCPResponse {
  output: any;
  error?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  examples: Array<{
    input: any;
    output: any;
  }>;
  handler: (request: MCPRequest) => Promise<MCPResponse>;
} 