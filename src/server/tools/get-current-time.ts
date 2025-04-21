import { MCPTool } from '../../types/mcp';
import { z } from "zod";

const rawShape: z.ZodRawShape = {};
export const getCurrentTimeTool: MCPTool = {
  name: 'get_current_time',
  description: '获取当前系统时间',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  parameters_zod: rawShape,
  examples: [
    {
      input: {},
      output: { time: '2023-12-01T12:00:00Z' }
    }
  ],
  handler: async (request) => {
    console.log("time result: ", new Date().toISOString());
    return {
      content: [
        {
          type: "text",
          text: new Date().toISOString(),
        },
      ],
    };
  }
}; 