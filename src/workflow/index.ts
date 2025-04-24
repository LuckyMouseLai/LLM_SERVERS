/**
 * 工作流模块入口文件
 */

export { MeetingWorkflow } from './MeetingWorkflow.js';
export { LLMService } from './llm.js';
export * from './types.js';

/**
 * 使用示例：
 * 
 * ```typescript
 * import { LLMService, MeetingWorkflow } from './workflow/index.js';
 * 
 * // 初始化LLM服务
 * const llmService = new LLMService();
 * 
 * // 初始化会议工作流
 * const meetingWorkflow = new MeetingWorkflow(llmService);
 * 
 * // 处理用户输入
 * async function handleUserInput(userInput: string) {
 *   const response = await meetingWorkflow.processInput(userInput);
 *   console.log(response.prompt); // 显示给用户的提示
 *   
 *   if (response.isCompleted) {
 *     console.log('工作流已完成，结果:', response.result);
 *     // 处理完成的工作流
 *   }
 * }
 * 
 * // 示例调用
 * handleUserInput('我想明天下午3点预约会议，参与者有张三、李四');
 * ```
 */

import { LLMService, MeetingWorkflow } from './index.js';

// 1. 初始化 LLM 服务
// 如果您有特定的配置（例如不同的 API 密钥或模型），可以在这里传入
const llmService = new LLMService(); 

// 2. 初始化会议预订工作流
// 将 LLM 服务实例传递给工作流
const meetingWorkflow = new MeetingWorkflow(llmService);

// 3. 模拟处理用户输入
async function handleUserInput(userInput: string) {
  console.log(`\n处理用户输入: "${userInput}"`);
  
  // 调用工作流的 processInput 方法
  const response = await meetingWorkflow.processInput(userInput);
  
  // 打印工作流返回的提示信息
  if (response.prompt) {
    console.log("工作流提示:", response.prompt);
  }
  
  // 检查工作流是否完成
  if (response.isCompleted) {
    if (response.result) {
        console.log('工作流已完成，最终收集到的参数:');
        console.log(JSON.stringify(response.result, null, 2));
        // 在这里可以添加调用日历 API 或其他服务的逻辑来实际预订会议
    } else {
        console.log('工作流已取消。');
    }
  } else {
      console.log('工作流仍在进行中，等待更多信息...');
  }
}

// 4. 运行示例
async function runExample() {
    // 第一次输入，提供部分信息
    await handleUserInput('我想预约一个会议，和张三一起');
    
    // 第二次输入，提供日期
    await handleUserInput('就定在明天吧');

    // 第三次输入，提供时间
    await handleUserInput('下午3点开始');
    
    // 可选：模拟用户确认
    // await handleUserInput('确认'); 
}

runExample(); 