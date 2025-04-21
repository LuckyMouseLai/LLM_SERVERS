import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { calculatorTool } from './calculator.js';
import { getCurrentTimeTool } from './get-current-time.js';
import { thirdPartyTool } from './third-party.js';
import { WeatherTool } from './weather.js';
import { deviceControlTool } from './device_control.js';
import { maintenanceTool } from './maintenance.js';
// 统一注册工具的函数
export const registerTools = (server: McpServer) => {
  const tools = [getCurrentTimeTool, WeatherTool, deviceControlTool, maintenanceTool, calculatorTool];

  tools.forEach(tool => {
    server.tool(
      tool.name,
      tool.description,
      tool.parameters_zod,
      tool.handler
    );
  });
};
