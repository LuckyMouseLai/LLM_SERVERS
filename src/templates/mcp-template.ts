import { MCPTool } from '../types/mcp';

/**
 * MCP工具模板
 * 使用此模板创建新的MCP工具
 */
export const mcpTemplate: MCPTool = {
  // 工具名称，使用小写字母和下划线
  name: 'your_tool_name',
  
  // 工具描述，说明工具的功能
  description: '工具的功能描述',
  
  // 工具参数定义
  parameters: {
    type: 'object',
    properties: {
      // 在这里定义工具需要的参数
      // 例如：
      // param1: { type: 'string', description: '参数1的描述' },
      // param2: { type: 'number', description: '参数2的描述' }
    },
    required: [
      // 在这里列出必需的参数名称
      // 'param1', 'param2'
    ]
  },
  
  // 工具使用示例
  examples: [
    {
      // 示例输入
      input: {
        // 示例参数值
        // param1: '示例值1',
        // param2: 123
      },
      // 示例输出
      output: {
        // 示例输出结果
        // result: '示例输出'
      }
    }
  ],
  
  // 工具处理函数
  handler: async (request) => {
    try {
      // 1. 获取输入参数
      // const { param1, param2 } = request.input;
      
      // 2. 执行工具逻辑
      // const result = await yourLogic(param1, param2);
      
      // 3. 返回结果
      return {
        output: {
          // result: result
        }
      };
    } catch (error) {
      // 4. 错误处理
      return {
        output: null,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }
};

/**
 * 添加新MCP工具的步骤：
 * 1. 复制此模板文件
 * 2. 修改工具名称、描述、参数和示例
 * 3. 实现handler函数
 * 4. 在src/server/index.ts中导入并注册新工具
 */ 