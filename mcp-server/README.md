# MCP 服务端和客户端

这是一个使用TypeScript和ModelContextProtocol实现的MCP服务端和客户端示例。

## 功能特点

- 服务端提供6个MCP工具：
  - 获取当前时间
  - 计算加减法
  - 智能家居设备控制
  - 物业报修服务
  - 天气查询
  - 模拟第三方MCP工具
- 客户端可以：
  - 自动连接服务端
  - 获取所有可用的MCP工具列表
  - 查看每个工具的详细信息和示例
  - 测试执行每个工具
- 使用Server-Sent Events (SSE)进行通信
- 支持Zod参数验证

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

## 工具列表及功能说明

1. **calculator** - 执行简单的加减法运算
2. **get_current_time** - 获取当前系统时间
3. **device_control** - 智能家居设备控制
   - 支持灯光、空调、窗帘等设备控制
   - 支持多种操作模式(turn_on/turn_off/adjust/query)
4. **maintenance** - 物业报修服务
   - 记录设备问题和维修请求
5. **get_weather** - 天气查询
   - 支持按城市和日期查询天气
6. **third_party_example** - 模拟第三方MCP工具

## 项目结构

```
src/
  ├── types/
  │   └── mcp.ts              # MCP接口定义
  ├── server/
  │   ├── index.ts            # 服务端主文件
  │   └── tools/              # MCP工具实现
  │       ├── calculator.ts
  │       ├── get-current-time.ts
  │       ├── device_control.ts
  │       ├── maintenance.ts
  │       ├── weather.ts
  │       └── third-party.ts
  └── client/
      └── index.ts            # 客户端实现
```

## 添加新工具

1. 复制 `src/server/tools/mcp-template.ts` 模板文件
2. 修改工具名称、描述、参数和示例
3. 在 `src/server/tools/register.ts` 中导入并注册新工具

## 开发注意事项

- 所有工具参数使用Zod进行类型验证
- 工具返回值需符合MCP格式规范
- 客户端会自动连接本地服务端
- 支持异步工具调用