declare module "@modelcontextprotocol/sdk/server/mcp.js" {
  export class McpServer {
    constructor(config: { name: string; version: string });
    resource: any;
    connect(transport: any): Promise<void>;
  }
}

declare module "@modelcontextprotocol/sdk/server/stdio.js" {
  export class StdioServerTransport {
    constructor();
  }
}

declare module "@modelcontextprotocol/sdk/server/sse.js" {
  export class SSEServerTransport {
    constructor(path: string, response: any);
    sessionId: string;
    handlePostMessage(request: any, response: any): Promise<void>;
  }
} 