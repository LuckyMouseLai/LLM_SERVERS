# MCP 服务端和客户端

这是一个使用TypeScript和ModelContextProtocol实现的MCP服务端和客户端示例。

## 功能特点

- 服务端提供3个MCP工具：
  - 获取当前时间
  - 计算加减法
  - 模拟第三方MCP工具
- 客户端可以：
  - 获取所有可用的MCP工具列表
  - 查看每个工具的详细信息和示例
  - 测试执行每个工具
- 使用Server-Sent Events (SSE)进行通信

## 安装和运行

1. 安装依赖：
```bash
npm install
```

2. 编译TypeScript代码：
```bash
npm run build
```

3. 启动服务端：
```bash
npm run start:server
```

4. 在另一个终端启动客户端：
```bash
npm run start:client
```

## API 端点

- `GET /sse` - 建立SSE连接
- `POST /messages` - 处理消息（需要提供sessionId）
- `GET /tools` - 获取所有可用的MCP工具列表

## 添加新的MCP工具

要添加新的MCP工具，请按照以下步骤操作：

1. 复制 `src/templates/mcp-template.ts` 文件到 `src/server/tools/` 目录下，并重命名为你的工具名称
2. 修改模板中的以下内容：
   - 工具名称（name）
   - 工具描述（description）
   - 参数定义（parameters）
   - 使用示例（examples）
   - 处理函数（handler）
3. 在 `src/server/index.ts` 中导入并注册新工具：
   ```typescript
   import { yourNewTool } from './tools/your-tool-name';
   
   // 在注册其他工具的地方添加
   server.resource = {
     ...server.resource,
     ...yourNewTool
   };
   ```

## 项目结构

```
src/
  ├── types/
  │   └── mcp.ts              # MCP接口定义
  ├── templates/
  │   └── mcp-template.ts     # MCP工具模板
  ├── server/
  │   ├── index.ts            # 服务端主文件
  │   └── tools/              # MCP工具实现
  │       ├── get-current-time.ts
  │       ├── calculator.ts
  │       └── third-party.ts
  └── client/
      └── index.ts            # 客户端实现
``` 