import { MCPTool } from '../../types/mcp';
import { z } from "zod";

const rawShape: z.ZodRawShape = {
  a: z.number().describe("第一个数字"),
  b: z.number().describe("第二个数字"), 
  operation: z.enum(["add", "subtract"]).describe("运算类型")
};

// 定义 calculatorTool
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
  parameters_zod: rawShape,
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
  handler: async (request: any) => {
    const { a = 0, b = 0, operation = 'add' } = request;
    let result: number | undefined;
    if (operation === 'add') {
      result = a + b;
    } else if (operation === 'subtract') {
      result = a - b;
    }
    return {
      content: [
        {
          type: "text",
          text: result !== undefined ? result.toString() : "计算结果未定义",
        },
      ],
    };
  }
};