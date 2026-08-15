# LLM Runtime & AI Inference Options Analysis

## Executive Summary

This report audits the available AI inference mechanisms for the **FlytBase GTM Intelligence** application across development and production deployment environments. 

It evaluates whether internal IDE/Codex credentials can be leveraged, checks hackathon infrastructure capabilities, and outlines the safest, most resilient architecture for deploying real LLM reasoning with a reliable deterministic fallback.

---

## 1. Investigation Findings for Core Questions

### Q1: Can Antigravity / Codex authentication be used programmatically by the application at runtime?
- **Finding**: **No.**
- **Rationale**: Antigravity IDE and Codex internal tokens belong exclusively to the IDE agent harness and its internal sandboxed protocol. They are not exported as runtime environment variables to Node.js / Next.js processes. The application runs as an independent process and cannot hijack IDE session credentials.

### Q2: Is an OpenAI-compatible endpoint available in this environment by default?
- **Finding**: **No local mock/daemon endpoint is running by default** (ports `11434` for Ollama and `1234` for LMStudio are currently inactive).
- **Rationale**: Standard public OpenAI-compatible endpoints (`https://api.openai.com/v1`, `https://api.groq.com/openai/v1`, `https://openrouter.ai/api/v1`) are accessible over standard HTTPS from the Next.js server runtime whenever an API key is supplied via environment variables.

### Q3: Does the hackathon provide any model/provider endpoint or free inference mechanism?
- **Finding**: **No.**
- **Rationale**: The FlytBase GTM Hackathon server at `https://flytbase-gtm-hackathon.lovable.app/api/mcp` strictly provides **read-only Book of Business MCP data tools** (`list_accounts`, `get_account_document`, `get_account_usage`, etc.). It does not host an LLM inference endpoint or completion API. Participants are expected to provide their own LLM API keys or local models.

### Q4: Are there existing installed SDKs or environment variables exposing a model service?
- **Finding**: None currently active.
- **Rationale**: `OPENAI_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, and `GROQ_API_KEY` are currently unset. However, standard Node.js `fetch` or lightweight SDKs (`openai`, `@google/genai`) can be added effortlessly.

### Q5: Will the deployed Next.js backend have access to the same credentials available during development?
- **Finding**: **Only environment variables explicitly configured in the hosting provider will be accessible.**
- **Rationale**: When deployed to Vercel, Railway, or Render, the serverless functions only read environment variables configured in that platform's environment settings. It will have zero access to local IDE state or `.env` files.

---

## 2. Comparison of Available LLM Runtime Options

| Option | Provider / Model | Auth Mechanism | Works Locally? | Works in Production Deployment? | Requires Separate API Key? | Security & Cost Implications | Implementation Complexity |
|---|---|---|:---:|:---:|:---:|---|:---:|
| **Option A: Google Gemini API** *(Recommended)* | Google Gemini 2.0 Flash / 1.5 Pro | `GEMINI_API_KEY` | Yes | Yes (Vercel / Railway / Node) | Yes (Free Tier Available) | High speed (sub-second), large context window (1M tokens), generous free tier for hackathons. | Low |
| **Option B: OpenAI API** | OpenAI `gpt-4o-mini` / `gpt-4o` | `OPENAI_API_KEY` | Yes | Yes | Yes | Industry standard structured JSON outputs; pay-per-token API cost. | Low |
| **Option C: Groq / Fast Inference** | Llama 3.3 70B / Mistral on Groq | `GROQ_API_KEY` (OpenAI-compatible) | Yes | Yes | Yes (Free Tier Available) | Ultra-fast (<500ms), OpenAI-compatible API format, generous free tier. | Very Low |
| **Option D: OpenRouter API** | Multi-model aggregator (Claude, Gemini, Llama) | `OPENROUTER_API_KEY` | Yes | Yes | Yes | Single key accesses all frontier models; flexible pricing. | Low |
| **Option E: Local Ollama / vLLM** | Local Llama 3.1 8B / Qwen 2.5 | None (Localhost HTTP) | Yes | **No** (Fails on standard serverless/cloud deployment without dedicated GPU instance) | No | High local RAM/CPU overhead; cannot run on Vercel without a separate self-hosted GPU proxy. | High |
| **Option F: Deterministic & Heuristic Engine** *(Current Active Fallback)* | In-Memory SQLite Evidence Parser | None | Yes | Yes | **No** | Zero cost, zero latency, 100% reproducible, zero external dependency failure risk. | Implemented |

---

## 3. Recommended Architecture for the Hackathon

To guarantee maximum reliability, demo resilience, and zero production crashes, we recommend a **Unified Multi-Provider Intelligence Gateway with Graceful Fallback**:

```
                              ┌──────────────────────────────────────┐
                              │     Account Intelligence Request     │
                              └──────────────────┬───────────────────┘
                                                 │
                                                 ▼
                              ┌──────────────────────────────────────┐
                              │      Provider Key Detection Check    │
                              │    (OPENAI, GEMINI, GROQ, ANTHROPIC) │
                              └──────────┬────────────────┬──────────┘
                                         │                │
                        [Key Present & Valid]        [No Key / API Error]
                                         │                │
                                         ▼                ▼
                      ┌──────────────────────┐  ┌──────────────────────┐
                      │ Dynamic LLM Provider │  │ Deterministic &      │
                      │ • Strict JSON schema │  │ Heuristic Fallback   │
                      │ • Fact extraction    │  │ • 100% Reproducible  │
                      │ • Zero-shot reasoning│  │ • Zero Latency       │
                      └──────────┬───────────┘  └──────────┬───────────┘
                                 │                         │
                                 └───────────┬─────────────┘
                                             ▼
                              ┌──────────────────────────────────────┐
                              │  Health Reconciliation & Priorities  │
                              │   (100% Deterministic Calculations)  │
                              └──────────────────┬───────────────────┘
                                                 ▼
                              ┌──────────────────────────────────────┐
                              │  SQLite / Prisma Intelligence Store  │
                              └──────────────────────────────────────┘
```

### Key Architectural Strengths:
1. **Zero Secret Leakage**: API keys remain strictly in environment variables (`process.env.GEMINI_API_KEY` or `process.env.OPENAI_API_KEY`).
2. **Fail-Safe Operation**: If an external LLM API rate limits, times out, or has no key provided, the system automatically falls back to the deterministic & heuristic engine without throwing errors or breaking the UI.
3. **Deployment Ready**: Works seamlessly both locally on the developer machine and in deployed environments (Vercel, Render, Railway).
4. **Verifiable Evidence**: Regardless of whether inferences originate from an LLM or the fallback parser, every claim is anchored to a specific source document and verbatim excerpt.

---

## 4. Next Step Recommendation

1. Implement a **Multi-Provider LLM Client Adapter** (`lib/intelligence/llm-provider.ts`) that supports **Google Gemini**, **OpenAI**, and **Groq** via standard `fetch`.
2. Connect `extractor.ts` to call the LLM when an API key is available, while automatically falling back to the heuristic engine when no key is configured.
