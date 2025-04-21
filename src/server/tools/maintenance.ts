import { MCPTool } from '../../types/mcp';
import { z } from "zod";

/**
 * MCP工具模板
 * 使用此模板创建新的MCP工具
 */
const rawShape: z.ZodRawShape = {
    device: z.string().describe("维修设备"),
    question: z.string().describe("设备问题描述"),
  };

export const maintenanceTool: MCPTool = {
  // 工具名称，使用小写字母和下划线
  name: 'maintenance',
  
  // 工具描述，说明工具的功能
  description: '物业保修',
  
  // 工具参数定义
  parameters: {
    type: 'object',
    properties: {
      device: { type: 'string', description: '维修设备' },
      question: { type: 'string', description: '设备问题描述' }
    },
    required: ['device','question']
  },
  parameters_zod: rawShape,
  // 工具使用示例
  examples: [
    {
      // 示例输入
      input: {
        device: '灯',
        question: '坏了'
      },
      // 示例输出
      output: {
        result: '地址：报修人：保修日期：报修设备：设备问题：'
      }
    }
  ],
  
  // 工具处理函数
  handler: async (request: any) => {
    try {
      // 1. 获取输入参数
      const { device, question } = request;
      
      // 2. 执行工具逻辑
      // const result = await yourLogic(param1, param2);
      const result = `${device} ${question}`;
      // 3. 返回结果
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      // 4. 错误处理
      return {
        content: [
          {
            type: "text",
            text: error instanceof Error ? error.message : '未知错误',
          },
        ],
      };
    }
  }
};
