import axios from 'axios';
import { EventSource } from 'eventsource';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const BASE_URL = 'http://localhost:3000';

interface MCPTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  examples: Array<{
    input: any;
    output: any;
  }>;
}

async function main() {
  try {
    // 获取所有MCP工具列表
    console.log('获取MCP工具列表...');
    const toolsResponse = await axios.get(`${BASE_URL}/tools`);
    const tools: MCPTool[] = toolsResponse.data;
    
    console.log('\n可用的MCP工具:');
    tools.forEach(tool => {
      console.log(`\n工具名称: ${tool.name}`);
      console.log(`描述: ${tool.description}`);
      console.log('示例:');
      tool.examples.forEach((example, index) => {
        console.log(`  示例 ${index + 1}:`);
        console.log(`    输入: ${JSON.stringify(example.input)}`);
        console.log(`    输出: ${JSON.stringify(example.output)}`);
      });
    });

    // 创建MCP客户端
    const client = new Client({
      name: "mcp-client",
      version: "1.0.0"
    });

    // 建立SSE连接
    console.log('\n建立SSE连接...');
    const transport = new SSEClientTransport(new URL(`${BASE_URL}/sse`), {
      requestInit: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    });
    await client.connect(transport);

    // 测试工具函数
    async function testTools(tools: MCPTool[]) {
      for (const tool of tools) {
        console.log(`\n测试工具: ${tool.name}`);
        
        for (const example of tool.examples) {
          console.log(`\n执行示例: ${JSON.stringify(example.input)}`);
          try {
            const result = await client.callTool({
              name: tool.name,
              arguments: example.input
            });
            console.log('结果:', result);
          } catch (error) {
            console.error('执行失败:', error instanceof Error ? error.message : '未知错误');
          }
        }
      }
      
      // 测试完成后关闭连接
      await transport.close();
    }

    // 开始测试工具
    await testTools(tools);

  } catch (error) {
    console.error('发生错误:', error instanceof Error ? error.message : '未知错误');
  }
}

main(); 