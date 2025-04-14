import { MCPTool } from '../../types/mcp';

export const thirdPartyTool: MCPTool = {
  name: 'third_party_example',
  description: '模拟第三方MCP工具',
  parameters: {
    type: 'object',
    properties: {
      message: { type: 'string', description: '要处理的消息' }
    },
    required: ['message']
  },
  examples: [
    {
      input: { message: 'Hello' },
      output: { processed_message: 'Hello from third party!' }
    }
  ],
  handler: async (request) => {
    // 模拟远程调用延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      output: { processed_message: `${request.input.message} from third party!` }
    };
  }
}; 