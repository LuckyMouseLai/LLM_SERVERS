import * as config from './config.js';
import { Agent } from './agent.js';

async function main() {
    const agent = new Agent('https://mcp.amap.com/sse?key=bec2c3f2768da638f5762106803e4866');
    await agent.initialize();

    // 对话场景
    // const response1 = await agent.processInput('你好');
    // console.log(response1.content); // 输出：我理解您想进行对话。你好

    // 工具执行场景
    // console.log('----------------------');
    // const response2 = await agent.processInput('使用search工具，关键词：typescript');
    // console.log(response2.content);
    // 如果参数完整，会执行工具并返回结果
    // 如果参数不完整，会要求提供缺失的参数
    console.log("\nMCP Client Started!");
    console.log("Type your queries or 'quit' to exit.");

    process.stdin.setEncoding('utf8');
    process.stdout.write("\nQuery: ");

    process.stdin.on('data', async (data) => {
      const message = data.toString().trim();
      
      if (message.toLowerCase() === "quit") {
        process.stdin.end();
        return;
      }

      const response = await agent.processInput(message);
      console.log("\n" + response.content);
      process.stdout.write("\nQuery: ");
    });

    // 等待输入流结束
    await new Promise<void>((resolve) => {
      process.stdin.on('end', () => {
        resolve();
      });
    });
  }
  
  main();