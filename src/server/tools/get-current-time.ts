import { MCPTool } from '../../types/mcp';

export const getCurrentTimeTool: MCPTool = {
  name: 'get_current_time',
  description: '获取当前系统时间',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  examples: [
    {
      input: {},
      output: { time: '2023-12-01T12:00:00Z' }
    }
  ],
  handler: async () => {
    return {
      output: { time: new Date().toISOString() }
    };
  }
}; 