import { MCPTool } from '../../types/mcp';
import { z } from "zod";

/**
 * MCP工具模板
 * 使用此模板创建新的MCP工具
 */
const rawShape: z.ZodRawShape = {
  control_intents: z.array(
    z.object({
      device_type: z.string().optional(),
      device_alias: z.string().optional(),
      action: z.string().optional(),
      parameters: z.object({
        brightness: z.number().min(0).max(100).optional(),
        temperature: z.number().min(16).max(30).optional(),
        position: z.number().min(0).max(100).optional(),
        device_mode: z.string().optional(),
        volume: z.number().min(0).max(100).optional(),
        windspeed: z.number().min(0).max(10).optional(),
        music_control: z.string().optional(),
        music_name: z.string().optional(),
        music_singer: z.string().optional()
      }).optional(),
      location: z.string().optional(),
      home_mode: z.string().optional()
    })
  ).describe("list of control intents for different devices")
};

export const deviceControlTool: MCPTool = {
  // 工具名称，使用小写字母和下划线
  name: 'device_control',
  
  // 工具描述，说明工具的功能
  description: '智能家居设备控制工具',
  
  // 工具参数定义
  parameters: {
    type: 'object',
    properties: {
        control_intents: {
            type: "array",
            description: "list of control intents for different devices",
            items: {
                type: "object",
                properties: {
                    device_type: {
                        type: "string",
                        description: "device type",
                        enum: ["light", "airCondition", "curtain", "underFloorHeating", 
                                "ventilation", "music", "camera"]
                    },
                    device_alias: {
                        type: "string",
                        description: "specific name of the device",
                        enum: ["地暖", "新风", "灯", "阅读灯", "厨房灯", "空调", "床头灯", "壁灯", "筒灯", "灯带", "窗帘", "射灯", "阳台灯"]
                    },
                    action: {
                        type: "string",
                        description: "control action: turn_on, turn_off, adjust, query",
                        enum: ["turn_on", "turn_off", "adjust", "query"]
                    },
                    parameters: {
                        type: "object",
                        description: "control parameters",
                        properties: {
                            brightness: {"type": "integer", "minimum": 0, "maximum": 100, "description": "brightness"},
                            temperature: {"type": "integer", "minimum": 16, "maximum": 30, "description": "temperature"},
                            position: {"type": "integer", "minimum": 0, "maximum": 100, "description": "position"},
                            device_mode: {"type": "string", "enum": ["自动模式", "手动模式", "定时模式", "制热模式", "制冷模式", "除湿模式", "风扇模式", "随机播放模式", "单曲循环模式", "列表循环模式"], "description": "device work mode"},
                            volume: {"type": "integer", "minimum": 0, "maximum": 100, "description": "volume"},
                            windspeed: {"type": "integer", "minimum": 0, "maximum": 10, "description": "windspeed"},
                            music_control: {"type": "string", "enum": ["play", "pause", "next", "previous"], "description": "music control"},
                            music_name: {"type": "string", "description": "music name"},
                            music_singer: {"type": "string", "description": "music singer"}
                        }
                    },
                    location: {
                        type: "string",
                        description: "location of the device in the house",
                        enum: ["次卧", "书房", "厨房", "卫生间", "客厅", "阳台", "卧室", "主卧"]
                    },
                    home_mode: {"type": "string", "enum": ["回家模式", "离家模式", "影院模式", "睡眠模式", "起床模式", "阅读模式", "聚会模式", "休闲模式", "浪漫模式", "夜间模式", "客人模式"], "description": "home mode, for example: 我回来了，我出门了，我要看电影，我要睡觉，我要起床，我要看书"}
                },
                required: ["device_type", "action"]
            }
        }
    },
    required: ["control_intents"]
  },
  parameters_zod: rawShape,
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
      const { control_intents } = request;
      
      // 2. 执行工具逻辑
      // const result = await yourLogic(param1, param2);
      
      // 3. 返回结果
      return {
        content: [
          {
            type: "text",
            text: control_intents.toString(),
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