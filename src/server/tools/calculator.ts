import { MCPTool } from '../../types/mcp';

export const calculatorTool: MCPTool = {
  name: 'calculator',
  description: '执行简单的加减法运算',
  parameters: {
    type: 'object',
    properties: {
      a: { type: 'number', description: '第一个数字' },
      b: { type: 'number', description: '第二个数字' },
      operation: { type: 'string', enum: ['add', 'subtract'], description: '运算类型' }
    },
    required: ['a', 'b', 'operation']
  },
  examples: [
    {
      input: { a: 5, b: 3, operation: 'add' },
      output: { result: 8 }
    },
    {
      input: { a: 5, b: 3, operation: 'subtract' },
      output: { result: 2 }
    }
  ],
  handler: async (request) => {
    const { a, b, operation } = request.input;
    let result;
    if (operation === 'add') {
      result = a + b;
    } else if (operation === 'subtract') {
      result = a - b;
    } else {
      return {
        output: null,
        error: '不支持的运算类型'
      };
    }
    return {
      output: { result }
    };
  }
}; 