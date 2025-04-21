import { z } from "zod";

export interface MCPTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  parameters_zod: z.ZodRawShape;
  examples: Array<{
    input: any;
    output: any;
  }>;
  handler: (request: any) => Promise<any>;
} 