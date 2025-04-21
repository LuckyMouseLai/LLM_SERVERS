import { MCPTool } from '../../types/mcp';
import { z } from "zod";
import axios from 'axios';
import express, { Request, Response } from "express";


/**
 * MCP工具模板
 * 使用此模板创建新的MCP工具
 */
const rawShape: z.ZodRawShape = {
  location: z.string().describe("城市或县区，比如北京市、杭州市、余杭区等。"),
  time: z.string().describe("查询时间，格式为YYYY-MM-DD，比如2024-04-15。"), 
  time_shift: z.number().describe("查询时间偏移量，比如0表示当天，1表示后一天，-1表示前一天。")
};

export const WeatherTool: MCPTool = {
  // 工具名称，使用小写字母和下划线
  name: 'get_weather',
  
  // 工具描述，说明工具的功能
  description: '获取天气',
  
  // 工具参数定义
  parameters: {
    type: 'object',
    properties: {
        location: {
            type: "string",
            description: "城市或县区，比如北京市、杭州市、余杭区等。"
        },
        time: {
            type: "string",
            description: "查询时间，格式为YYYY-MM-DD，比如2024-04-15。"
        },
        time_shift: {
            type: "integer",
            description: "查询时间偏移量，比如0表示当天，1表示后一天，-1表示前一天。"
        }
    },
    required: [
      "time_shift"
      // 在这里列出必需的参数名称
      // 'param1', 'param2'
    ]
  },
  parameters_zod: rawShape,
  // 工具使用示例
  examples: [
    {
      // 示例输入
      input: {
        location: "福州",
        time: "2024-2-5",
        time_shift: 0
      },
      // 示例输出
      output: {
        // result: '示例输出'
      }
    }
  ],
  
  // 工具处理函数
  handler: async (request: any) => {
    
    try {
      const { location, time, time_shift } = request;
      const apiKey = "SQ_M1K7N1vpiFFSgB";
      const apiUrl = `https://api.seniverse.com/v3/weather/daily.json?key=${apiKey}&location=${location}&language=zh-Hans&unit=c&start=${time_shift}&days=1`;
      const response = await axios.get(apiUrl);
      const { results } = response.data;
      let result = "";
      if (results && results.length > 0) {
          const { location, daily, last_update } = results[0];
          const { date, text_day, code_day, text_night, code_night, high, low, rainfall, precip, wind_direction, wind_direction_degree, wind_speed, wind_scale, humidity} = daily[0];

          result = `${location.name} ${date} ${text_day}转${text_night}, 气温${low}到${high}度`;
      } else {
          console.log("未获取到有效的天气数据");
      }
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