# FlytBase GTM Hackathon MCP Specification & Tool Reference

## 1. Overview & Connection Architecture

The FlytBase GTM Hackathon provides read-only programmatic access to the **Book of Business** (and Solutions Engineering dataset) via a **Model Context Protocol (MCP)** server over **MCP Streamable HTTP** (JSON-RPC 2.0 over HTTP POST).

- **Endpoint URL**: `https://flytbase-gtm-hackathon.lovable.app/api/mcp`
- **Transport**: MCP Streamable HTTP (`POST` with JSON-RPC 2.0 payloads)
- **Protocol Version**: `2025-06-18` (compatible with standard MCP client initialization `2024-11-05` / `2025-06-18`)
- **Server Name**: `flytbase-book-of-business` (v1.0.0)
- **Authentication**: HTTP Bearer Token in `Authorization` header

```http
POST /api/mcp HTTP/1.1
Host: flytbase-gtm-hackathon.lovable.app
Authorization: Bearer $FLYTBASE_MCP_TOKEN
Content-Type: application/json
Accept: application/json, text/event-stream
```

> [!IMPORTANT]
> **Environment Variable Security**: Keep the authorization token stored in an environment variable (`FLYTBASE_MCP_TOKEN`). Never hardcode the bearer token into tracked source code.

---

## 2. MCP Handshake & Protocol Flow

### Step 1: Initialize Session
**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "flytbase-client",
      "version": "1.0.0"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2025-06-18",
    "capabilities": {
      "tools": {}
    },
    "serverInfo": {
      "name": "flytbase-book-of-business",
      "version": "1.0.0"
    }
  }
}
```

### Step 2: List Available Tools (`tools/list`)
**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list",
  "params": {}
}
```

### Step 3: Execute a Tool (`tools/call`)
**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "tool_name",
    "arguments": {
      "param_key": "param_value"
    }
  }
}
```

**Response Structure:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "<JSON_STRING_OR_MARKDOWN_STRING>"
      }
    ]
  }
}
```

---

## 3. Discovered MCP Tools Catalog

The MCP server exposes **9 tools** grouped into two primary domains:
1. **Customer Success (CS) Book of Business Tools** (6 tools)
2. **Solutions Engineering (SE) Dataset Tools** (3 tools)

---

### Domain 1: Customer Success (Book of Business)

#### 1. `list_accounts`
- **Description**: Returns all 14 accounts in the Book of Business with raw CRM-style metadata. No analysis applied.
- **Input Parameters**: None (`{}`)
- **Return Type**: `JSON Array` (stringified inside `result.content[0].text`)
- **Item Fields**:
  - `id` *(string)*: Unique account slug (e.g. `"ashford-construction"`, `"northline-grid"`, `"ravel-systems"`).
  - `accountId` *(string)*: CRM account code (e.g. `"ACC-01120"`).
  - `folder` *(string)*: Internal folder name (e.g. `"account_04_ashford_construction"`).
  - `name` *(string)*: Customer business name.
  - `category` *(string)*: Lifecycle category (`"pre-sale"`, `"newly-sold-onboarding"`, `"established"`, `"renewal-focused"`, `"churned"`).
  - `categoryFolder` *(string)*: Folder prefix category (e.g. `"01_Pre-Sale"`).
  - `vertical` *(string)*: Industry / sector (e.g. `"Construction"`, `"Industrial / Rail Logistics"`, `"Utilities / Grid"`).
  - `region` *(string)*: Geographic area (e.g. `"North America"`, `"Europe"`, `"UK / Public Sector"`).
  - `arr` *(number)*: Annual Recurring Revenue in USD (e.g. `0`, `3999`, `61400`).
  - `docks` *(string)*: Hardware deployment description.
  - `health` *(string)*: CRM health label (e.g. `"Healthy"`, `"Neutral"`, `"At Risk"`).
  - `sentiment` *(string)*: CRM sentiment label.
  - `tier` *(string)*: Tier classification.
  - `csOwner` *(string)*: Assigned CS Manager.
  - `seOwner` *(string)*: Assigned Solutions Engineer.
  - `championTagged` *(string | null)*: Tagged internal customer champion.

**Example Response Data:**
```json
[
  {
    "id": "northline-grid",
    "folder": "account_08_northline_grid",
    "accountId": "ACC-08301",
    "name": "Northline Grid Authority",
    "category": "renewal-focused",
    "categoryFolder": "04_Renewal-Focused",
    "vertical": "Utilities / Grid",
    "region": "North America",
    "arr": 61400,
    "docks": "4 live (2 sub-stations, 2 line hubs)",
    "health": "Healthy",
    "sentiment": "Positive",
    "tier": "Enterprise",
    "csOwner": "Devansh M.",
    "seOwner": "Farhan Qureshi",
    "championTagged": "Elena Rostova"
  }
]
```

---

#### 2. `get_account`
- **Description**: Retrieves full metadata for one account by `id`, including the list of source documents available for it.
- **Input Parameters**:
  - `id` *(string, required)*: Account slug, e.g. `"northline-grid"`.
- **Return Type**: `JSON Object` (stringified inside `result.content[0].text`)
- **Return Structure**: Contains all account metadata fields plus a `documents` array:
  ```json
  {
    "id": "ashford-construction",
    "name": "Ashford Construction Group",
    ...,
    "documents": [
      {
        "file": "01_account_profile.md",
        "title": "Account Profile",
        "type": "profile"
      },
      {
        "file": "02_transcript_alarm_integration_call.md",
        "title": "Call Transcript — Alarm Sensor Integration",
        "type": "transcript",
        "date": "2026-05-19"
      },
      {
        "file": "04_email_pricing_followup.md",
        "title": "Email Thread — Pricing Follow-Up",
        "type": "email"
      }
    ]
  }
  ```

---

#### 3. `list_account_documents`
- **Description**: Lists source documents (profiles, call transcripts, renewal trackers, tickets, notes, emails) available for a specific account.
- **Input Parameters**:
  - `id` *(string, required)*: Account slug (e.g. `"walcross-materials"`).
- **Return Type**: `JSON Array` (stringified inside `result.content[0].text`)
- **Item Fields**:
  - `file` *(string)*: File path key (e.g. `"01_account_profile.md"`).
  - `title` *(string)*: Human-readable title.
  - `type` *(string)*: Document category (`"profile"`, `"transcript"`, `"email"`, `"notes"`, `"deal"`, `"ticket"`, `"renewal"`).
  - `date` *(string, optional)*: Date in `YYYY-MM-DD` format if applicable.

---

#### 4. `get_account_document`
- **Description**: Fetches the full raw Markdown content of a specific document for an account.
- **Input Parameters**:
  - `id` *(string, required)*: Account slug.
  - `file` *(string, required)*: File name from `list_account_documents`.
- **Return Type**: `Plain Markdown Text` (returned directly in `result.content[0].text`).
- **Example Usage**:
  `{ "id": "ashford-construction", "file": "01_account_profile.md" }`
  Returns Markdown tables and transcripts with full context, meeting participants, verbatim dialogue, and notes.

---

#### 5. `search_documents`
- **Description**: Substring search across all documents across all 14 accounts in the Book of Business.
- **Input Parameters**:
  - `query` *(string, required)*: Substring keyword or phrase to match (case-insensitive).
- **Return Type**: `Text string with formatted snippet sections`
- **Output Format**: Matching snippets are returned delimited by `---` and tagged with `[<account_id> / <filename.md>]`.

---

#### 6. `get_account_usage`
- **Description**: Live monthly flight hours and mission counts history for an account.
- **Input Parameters**:
  - `id` *(string, required)*: Account slug (e.g. `"northline-grid"`).
- **Return Type**: `JSON Array` (stringified inside `result.content[0].text`).
- **Data Shape**:
  ```json
  [
    {
      "month": "2025-12",
      "flightHours": 52,
      "missions": 34
    },
    {
      "month": "2026-01",
      "flightHours": 55,
      "missions": 36
    }
  ]
  ```
  *(Returns `[]` for pre-sale prospects or non-flying accounts).*

> [!TIP]
> **Dynamic Polling Notice**: The Book of Business data dynamically updates (e.g. new transcripts, tickets, usage metrics). Applications should poll or sync periodically.

---

### Domain 2: Solutions Engineering (SE) Dataset

#### 7. `se_list_dataset_files`
- **Description**: Lists files in the synthetic SE customer-data corpus (5 core files: `accounts.md`, `issues.md`, `feature_requests.md`, `tasks.md`, `meeting_notes.md`).
- **Input Parameters**: None (`{}`)
- **Return Type**: `JSON Array` (stringified inside `result.content[0].text`).
- **Available Files**:
  1. `accounts.md`: 51 accounts (ID, Name, Industry, Region, Tier, Health, ARR, Owner, Devices).
  2. `issues.md`: 961 support tickets.
  3. `feature_requests.md`: 55 feature requests with revenue impact.
  4. `tasks.md`: 473 CS/SE task queue entries.
  5. `meeting_notes.md`: 276 call/meeting summaries.

---

#### 8. `se_get_dataset_file`
- **Description**: Retrieves the complete Markdown content of one file from the SE dataset.
- **Input Parameters**:
  - `file` *(string, required)*: File name (e.g. `"feature_requests.md"` or `"accounts.md"`).
- **Return Type**: `Plain Markdown Text` in `result.content[0].text`.

---

#### 9. `se_search_dataset`
- **Description**: Substring search across all 5 dataset files in the SE corpus.
- **Input Parameters**:
  - `query` *(string, required)*: Substring keyword.
- **Return Type**: `Text string with formatted snippet sections` labeled by `[<filename.md>]`.

---

## 4. Summary Table of All Tools

| Tool Name | Scope | Required Inputs | Return Data Format |
|---|---|---|---|
| `list_accounts` | CS Book of Business | None | Stringified JSON array of 14 accounts |
| `get_account` | CS Book of Business | `id` (string) | Stringified JSON account object with `documents` list |
| `list_account_documents` | CS Book of Business | `id` (string) | Stringified JSON array of document references |
| `get_account_document` | CS Book of Business | `id` (string), `file` (string) | Raw Markdown text content |
| `search_documents` | CS Book of Business | `query` (string) | Text snippets tagged by `[account / file]` |
| `get_account_usage` | CS Book of Business | `id` (string) | Stringified JSON array of monthly usage metrics |
| `se_list_dataset_files` | SE Dataset | None | Stringified JSON array of 5 dataset files |
| `se_get_dataset_file` | SE Dataset | `file` (string) | Raw Markdown text of dataset file |
| `se_search_dataset` | SE Dataset | `query` (string) | Text snippets tagged by `[file.md]` |

---

## 5. Client Integration Code Examples

### A. TypeScript / Node.js (MCP Client Helper)

```typescript
import dotenv from 'dotenv';
dotenv.config();

const MCP_ENDPOINT = process.env.FLYTBASE_MCP_ENDPOINT || 'https://flytbase-gtm-hackathon.lovable.app/api/mcp';
const MCP_TOKEN = process.env.FLYTBASE_MCP_TOKEN;

if (!MCP_TOKEN) {
  throw new Error('FLYTBASE_MCP_TOKEN environment variable is required');
}

let requestId = 1;

async function callMcpRpc(method: string, params: Record<string, any> = {}) {
  const response = await fetch(MCP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MCP_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream'
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: requestId++,
      method,
      params
    })
  });

  if (!response.ok) {
    throw new Error(`MCP request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`MCP Error ${data.error.code}: ${data.error.message}`);
  }
  return data.result;
}

// 1. Initialize
export async function initializeMcp() {
  return await callMcpRpc('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'flytbase-agent', version: '1.0.0' }
  });
}

// 2. Call Tool Helper
export async function invokeTool<T = any>(toolName: string, args: Record<string, any> = {}): Promise<T> {
  const result = await callMcpRpc('tools/call', {
    name: toolName,
    arguments: args
  });

  const textContent = result.content?.[0]?.text;
  if (!textContent) return textContent;

  try {
    return JSON.parse(textContent) as T;
  } catch {
    return textContent as unknown as T; // Raw Markdown or text
  }
}
```

### B. Python Client (Direct JSON-RPC over HTTP)

```python
import os
import json
import httpx

MCP_ENDPOINT = os.getenv("FLYTBASE_MCP_ENDPOINT", "https://flytbase-gtm-hackathon.lovable.app/api/mcp")
MCP_TOKEN = os.getenv("FLYTBASE_MCP_TOKEN")

if not MCP_TOKEN:
    raise ValueError("FLYTBASE_MCP_TOKEN environment variable is not set")

headers = {
    "Authorization": f"Bearer {MCP_TOKEN}",
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream"
}

def call_mcp_rpc(method: str, params: dict = None, request_id: int = 1):
    payload = {
        "jsonrpc": "2.0",
        "id": request_id,
        "method": method,
        "params": params or {}
    }
    with httpx.Client(timeout=30.0) as client:
        response = client.post(MCP_ENDPOINT, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        if "error" in data:
            raise RuntimeError(f"MCP RPC Error: {data['error']}")
        return data.get("result")

def invoke_tool(name: str, arguments: dict = None):
    res = call_mcp_rpc("tools/call", {"name": name, "arguments": arguments or {}})
    text_content = res.get("content", [{}])[0].get("text", "")
    try:
        return json.loads(text_content)
    except json.JSONDecodeError:
        return text_content
```
