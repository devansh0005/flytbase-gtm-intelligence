import {
  McpAccount,
  McpAccountWithDocs,
  McpDocumentMeta,
  McpUsageRecord,
  McpDatasetFile,
} from "./types";

export class FlytBaseMcpClient {
  private endpoint: string;
  private token: string;
  private requestId = 1;

  constructor(endpoint?: string, token?: string) {
    this.endpoint =
      endpoint ||
      process.env.FLYTBASE_MCP_ENDPOINT ||
      "https://flytbase-gtm-hackathon.lovable.app/api/mcp";
    this.token = token || process.env.FLYTBASE_MCP_TOKEN || "";

    if (!this.token) {
      console.warn(
        "[FlytBaseMcpClient] Warning: FLYTBASE_MCP_TOKEN is not set in environment variables."
      );
    }
  }

  private async callRpc<T = any>(method: string, params: Record<string, any> = {}): Promise<T> {
    if (!this.token) {
      throw new Error("Missing FLYTBASE_MCP_TOKEN. Please set it in your environment variables.");
    }

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "User-Agent": "FlytBase-GTM-Intelligence/1.0",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: this.requestId++,
        method,
        params,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `MCP HTTP error: ${response.status} ${response.statusText}${
          errorText ? ` - ${errorText}` : ""
        }`
      );
    }

    const json = await response.json();
    if (json.error) {
      throw new Error(`MCP RPC Error [${json.error.code}]: ${json.error.message}`);
    }

    return json.result;
  }

  private async callTool<T = any>(name: string, args: Record<string, any> = {}): Promise<T> {
    const result = await this.callRpc("tools/call", {
      name,
      arguments: args,
    });

    const contentItem = result?.content?.[0];
    if (!contentItem || typeof contentItem.text !== "string") {
      throw new Error(`Unexpected MCP tool response format for tool "${name}"`);
    }

    try {
      return JSON.parse(contentItem.text) as T;
    } catch {
      // Returns raw markdown / text if not JSON formatted
      return contentItem.text as unknown as T;
    }
  }

  // MCP Standard Handshake
  public async initialize(): Promise<{
    protocolVersion: string;
    capabilities: any;
    serverInfo: { name: string; version: string };
  }> {
    return this.callRpc("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "flytbase-gtm-intelligence",
        version: "1.0.0",
      },
    });
  }

  public async listTools(): Promise<any[]> {
    const result = await this.callRpc("tools/list", {});
    return result?.tools || [];
  }

  // --- Customer Success Book of Business Tools ---

  public async listAccounts(): Promise<McpAccount[]> {
    return this.callTool<McpAccount[]>("list_accounts", {});
  }

  public async getAccount(id: string): Promise<McpAccountWithDocs> {
    return this.callTool<McpAccountWithDocs>("get_account", { id });
  }

  public async listAccountDocuments(id: string): Promise<McpDocumentMeta[]> {
    return this.callTool<McpDocumentMeta[]>("list_account_documents", { id });
  }

  public async getAccountDocument(id: string, file: string): Promise<string> {
    return this.callTool<string>("get_account_document", { id, file });
  }

  public async searchDocuments(query: string): Promise<string> {
    return this.callTool<string>("search_documents", { query });
  }

  public async getAccountUsage(id: string): Promise<McpUsageRecord[]> {
    return this.callTool<McpUsageRecord[]>("get_account_usage", { id });
  }

  // --- Solutions Engineering Tools ---

  public async seListDatasetFiles(): Promise<McpDatasetFile[]> {
    return this.callTool<McpDatasetFile[]>("se_list_dataset_files", {});
  }

  public async seGetDatasetFile(file: string): Promise<string> {
    return this.callTool<string>("se_get_dataset_file", { file });
  }

  public async seSearchDataset(query: string): Promise<string> {
    return this.callTool<string>("se_search_dataset", { query });
  }
}

export const mcpClient = new FlytBaseMcpClient();
