import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as fs from 'fs';
import * as path from 'path';

/**
 * MCP服务器配置接口
 * @interface MCPServerConfig
 * @property {string} [url] - 远程MCP服务器的URL（用于SSE传输）
 * @property {string} [type] - 传输类型，目前支持'sse'或自动识别
 * @property {string} [command] - 用于启动本地MCP的命令（用于stdio传输）
 * @property {string[]} [args] - 命令行参数（用于stdio传输）
 * @property {Record<string, string>} [env] - 环境变量配置（用于stdio传输）
 */
interface MCPServerConfig {
    url?: string;
    type?: string;
    command?: string;
    args?: string[];
    env?: Record<string, string>;
}

/**
 * MCP配置接口，用于解析配置文件
 * @interface MCPConfig
 * @property {Record<string, MCPServerConfig>} mcpServers - 所有MCP服务器的配置项
 */
interface MCPConfig {
    mcpServers: Record<string, MCPServerConfig>;
}

/**
 * MCP客户端类，用于管理多个MCP服务器连接和工具调用
 * @class MCPClient
 */
export class MCPClient {
    /** 存储所有连接的MCP客户端，键为服务器名称 */
    private clients: Map<string, Client> = new Map();
    /** 存储每个服务器提供的工具，键为服务器名称 */
    private tools: Map<string, any[]> = new Map();
    /** 合并后的所有工具列表 */
    private allTools: any[] = [];
    /** MCP配置文件路径 */
    private configPath: string;

    /**
     * 构造函数
     * @param {string} configPath - MCP配置文件的路径
     */
    constructor(configPath: string) {
        this.configPath = configPath;
    }

    /**
     * 初始化MCP客户端
     * 读取配置文件，并为每个配置的服务器创建连接
     * @returns {Promise<void>}
     */
    async initialize(): Promise<void> {
        try {
            console.log("正在初始化MCP客户端...");
            
            // 读取配置文件
            const config = this.loadConfig();
            
            // 初始化每个MCP服务器
            for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
                await this.initializeServer(serverName, serverConfig);
            }
            
            // 合并所有工具
            this.mergeAllTools();
            
            console.log(`已初始化 ${this.clients.size} 个MCP服务器，共获取到 ${this.allTools.length} 个可用工具`);
            // 打印所有已连接的服务器名称
            console.log("已连接的服务器列表:");
            for (const serverName of this.clients.keys()) {
                console.log(`- ${serverName}`);
            }

            // 打印所有可用工具名称
            console.log("\n可用工具列表:");
            this.allTools.forEach((tool, index) => {
                console.log(`- ${tool.name}`);
            });
        } catch (error) {
            console.error("MCP客户端初始化失败:", error);
            throw error;
        }
    }

    /**
     * 加载并解析MCP配置文件
     * @returns {MCPConfig} 解析后的配置对象
     * @throws 如果配置文件不存在或格式错误
     */
    private loadConfig(): MCPConfig {
        try {
            const configContent = fs.readFileSync(this.configPath, 'utf-8');
            const config = JSON.parse(configContent) as MCPConfig;
            return config;
        } catch (error) {
            console.error("读取MCP配置失败:", error);
            throw error;
        }
    }

    /**
     * 初始化单个MCP服务器
     * @param {string} serverName - 服务器名称
     * @param {MCPServerConfig} config - 服务器配置
     * @returns {Promise<void>}
     */
    private async initializeServer(serverName: string, config: MCPServerConfig): Promise<void> {
        try {
            // 创建新的MCP客户端
            const client = new Client({ 
                name: `${serverName}`, 
                version: "1.0.0" 
            });
            
            // 根据配置类型初始化传输
            let transport;
            if (config.url && (config.type === 'sse' || !config.type)) {
                // 使用SSE传输（适用于远程MCP服务器）
                transport = new SSEClientTransport(new URL(config.url));
                console.log(`使用SSE传输连接到 ${serverName}: ${config.url}`);
            } else if (config.command && config.args) {
                // 使用Stdio传输（适用于本地MCP进程）
                // 设置环境变量
                const env: Record<string, string> = {};
                
                // 复制有效的环境变量
                if (config.env) {
                    for (const [key, value] of Object.entries(config.env)) {
                        if (value !== undefined) {
                            env[key] = value;
                        }
                    }
                }
                
                transport = new StdioClientTransport({
                    command: config.command,
                    args: config.args,
                    env: env
                });
                console.log(`使用Stdio传输连接到 ${serverName}: ${config.command} ${config.args.join(' ')}`);
            } else {
                throw new Error(`服务器 ${serverName} 配置无效`);
            }

            // 连接到服务器
            client.connect(transport);
            // 等待连接建立
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 获取可用工具列表
            const toolsResult = await client.listTools();
            
            if (!toolsResult || !toolsResult.tools || toolsResult.tools.length === 0) {
                console.warn(`服务器 ${serverName} 未提供工具`);
                // 不抛出错误，继续处理其他服务器
                return;
            }
            
            // 存储客户端和工具
            this.clients.set(serverName, client);
            
            // 为每个工具添加来源标识，便于后续工具执行时找到对应的客户端
            const toolsWithSource = toolsResult.tools.map(tool => ({
                ...tool,
                _source: serverName // 添加源服务器标识
            }));
            
            this.tools.set(serverName, toolsWithSource);
            console.log(`已连接到MCP服务器 ${serverName}，获取到 ${toolsWithSource.length} 个可用工具`);
        } catch (error) {
            console.error(`初始化服务器 ${serverName} 失败:`, error);
            // 不抛出错误，继续处理其他服务器
        }
    }

    /**
     * 合并所有服务器的工具到一个列表中
     * @private
     */
    private mergeAllTools(): void {
        this.allTools = [];
        for (const tools of this.tools.values()) {
            this.allTools.push(...tools);
        }
    }

    /**
     * 获取工具列表
     * @param {string} [serverName] - 可选的服务器名称，如果提供则只返回该服务器的工具
     * @returns {any[]} 工具列表
     */
    getTools(serverName?: string): any[] {
        if (serverName) {
            return this.tools.get(serverName) || [];
        }
        return this.allTools;
    }

    /**
     * 获取指定服务器的客户端
     * @param {string} serverName - 服务器名称
     * @returns {Client | undefined} MCP客户端实例或undefined（如果不存在）
     */
    getClient(serverName: string): Client | undefined {
        return this.clients.get(serverName);
    }

    /**
     * 获取所有MCP客户端
     * @returns {Map<string, Client>} 所有MCP客户端的映射
     */
    getClients(): Map<string, Client> {
        return this.clients;
    }

    /**
     * 执行工具
     * 自动查找工具来源并使用对应的客户端执行
     * @param {string} toolName - 工具名称
     * @param {Record<string, any>} parameters - 工具参数
     * @returns {Promise<any>} 工具执行结果
     * @throws 如果工具不存在或执行失败
     */
    async executeTool(toolName: string, parameters: Record<string, any>): Promise<any> {
        // 查找工具并确定其来源
        const tool = this.allTools.find(t => t.name === toolName);
        if (!tool) {
            throw new Error(`工具 ${toolName} 不存在`);
        }
        
        const serverName = tool._source;
        const client = this.clients.get(serverName);
        
        if (!client) {
            throw new Error(`无法找到工具 ${toolName} 的MCP客户端`);
        }

        try {
            console.log(`正在调用工具: ${toolName}（来自 ${serverName}），参数:`, JSON.stringify(parameters, null, 2));
            
            // 调用工具并返回结果
            const result = await client.callTool({
                name: toolName,
                arguments: parameters
            });
            
            console.log(`工具 ${toolName} 调用成功:`, JSON.stringify(result, null, 2));
            return result;
        } catch (error) {
            console.error(`工具调用失败: ${toolName}`, error);
            throw error;
        }
    }
} 