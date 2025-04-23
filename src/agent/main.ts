import * as config from './config.js';
import { Agent } from './agent.js';

async function main() {
    const agent = new Agent('mcp.json');
    await agent.initialize();
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