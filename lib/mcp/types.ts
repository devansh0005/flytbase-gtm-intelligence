export interface McpAccount {
  id: string;
  folder: string;
  accountId: string;
  name: string;
  category: "pre-sale" | "newly-sold-onboarding" | "established" | "renewal-focused" | "churned" | string;
  categoryFolder: string;
  vertical: string;
  region: string;
  arr: number;
  docks: string;
  health: string;
  sentiment: string;
  tier: string;
  csOwner: string;
  seOwner: string;
  championTagged: string | null;
}

export interface McpDocumentMeta {
  file: string;
  title: string;
  type: string;
  date?: string;
}

export interface McpAccountWithDocs extends McpAccount {
  documents: McpDocumentMeta[];
}

export interface McpUsageRecord {
  month: string; // "YYYY-MM"
  flightHours: number;
  missions: number;
}

export interface McpDatasetFile {
  file: string;
  title: string;
  description: string;
}
