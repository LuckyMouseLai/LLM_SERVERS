# MCP Server and Client

这是一个基于 Model Context Protocol (MCP) 的服务器和客户端实现，使用 TypeScript 编写。

## 功能特点

- 实现了 MCP 协议的服务端和客户端
- 支持 SSE (Server-Sent Events) 通信
- 提供了多个示例工具：
  - 获取当前时间
  - 计算器
  - 第三方 API 调用示例

## 技术栈

- TypeScript
- Express.js
- Model Context Protocol SDK
- Server-Sent Events (SSE)

## 安装

1. 克隆仓库：
```bash
git clone <repository-url>
cd mcp-server-client
```

2. 安装依赖：
```bash
npm install
```

## 使用方法

### 启动服务器

```bash
npm run build
npm run start:server
```

服务器将在 http://localhost:3000 启动。

### 启动客户端

```bash
npm run start:client
```

客户端将连接到服务器并测试所有可用的工具。

## API 端点

- `GET /sse` - 建立 SSE 连接
- `POST /messages` - 处理消息
- `GET /tools` - 获取可用工具列表

## 项目结构

```
src/
├── client/           # 客户端代码
├── server/           # 服务器代码
│   └── tools/        # 工具实现
└── types/            # 类型定义
```

## 开发

1. 修改代码后需要重新构建：
```bash
npm run build
```

2. 启动开发服务器：
```bash
npm run start:server
```

3. 启动开发客户端：
```bash
npm run start:client
```

## 许可证

MIT 