import { GoogleGenAI } from "@google/genai";
import {
  LLMContextInput,
  QualitativeIntelligenceOutput,
  LLMObservabilityMetadata,
} from "./types";
import { IntelligenceValidator } from "./validator";

export class GeminiProvider {
  private apiKey: string;
  private modelName: string;

  constructor(apiKey?: string, modelName?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || "";
    this.modelName = modelName || process.env.GEMINI_MODEL || "gemini-2.0-flash";
  }

  public isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async generateAccountIntelligence(
    context: LLMContextInput
  ): Promise<{
    intelligence: QualitativeIntelligenceOutput;
    observability: LLMObservabilityMetadata;
  }> {
    if (!this.isAvailable()) {
      throw new Error("GEMINI_API_KEY is not set.");
    }

    const startTime = Date.now();
    const ai = new GoogleGenAI({ apiKey: this.apiKey });

    const systemInstruction = `You are the lead Customer Success and Solutions Engineering intelligence analyst for FlytBase (enterprise drone-in-a-box orchestration software).
Your mission is to perform qualitative reasoning over the provided customer account documents and deterministic behavioral metrics to produce a unified, evidence-backed intelligence assessment.

CRITICAL RULES:
1. NEVER fabricate data or numbers. ARR ($${context.deterministicSignals.nominalArr}), usage metrics, and renewal dates are deterministically computed and MUST be preserved.
2. Every claim, stakeholder role, risk, blocker, and action MUST be anchored with an exact verbatim excerpt from the source documents provided.
3. Only reference document file names that actually exist in the account manifest: ${JSON.stringify(
      context.availableDocumentFiles
    )}.
4. Reconcile health truthfully: If CRM metadata says 'Healthy' but flight usage has collapsed or renewal is past-due/jeopardized, you MUST flag the contradiction and diagnose the true health as AT_RISK or CRITICAL.
5. If the account is churned, determine the real root cause and evaluate win-back viability based on actual customer dialogue.
6. Output STRICT JSON conforming to the requested schema. No markdown backticks, no conversational text.`;

    const prompt = `Account To Analyze:
Name: "${context.accountName}" (ID: "${context.accountId}")
CRM Record: ${JSON.stringify(context.crmRecord, null, 2)}
Deterministic Signals (Calculated from telemetry & records): ${JSON.stringify(
      context.deterministicSignals,
      null,
      2
    )}

Source Documents Content:
${context.documents
  .map(
    (d) => `=== DOCUMENT: ${d.fileName} (${d.title}, Type: ${d.type}) ===
${d.content}
`
  )
  .join("\n")}

Respond ONLY with a JSON object with this exact structure:
{
  "reconciledHealth": "HEALTHY" | "WATCH" | "AT_RISK" | "CRITICAL" | "CHURNED",
  "healthRationale": "2-3 sentence diagnosis citing hard evidence",
  "topRiskFactors": ["risk 1", "risk 2"],
  "contradictions": ["CRM says Healthy but usage dropped 60%"],
  "sentiment": "POSITIVE" | "NEUTRAL" | "CONCERNED" | "NEGATIVE",
  "stakeholders": [
    {
      "name": "Full Name",
      "role": "Title / Role",
      "authorityLevel": "ECONOMIC_BUYER" | "TECHNICAL_EVALUATOR" | "OPERATOR" | "PROCUREMENT" | "INFLUENCER",
      "sentiment": "CHAMPION" | "POSITIVE" | "NEUTRAL" | "CONCERNED" | "DETRACTOR" | "GHOSTING",
      "isLikelyChampion": true | false,
      "notes": "Context",
      "evidence": {
        "claim": "Role description",
        "sourceDoc": "filename.md",
        "excerpt": "verbatim text from doc",
        "confidence": 0.95
      }
    }
  ],
  "likelyChampion": "Name or null",
  "risks": [
    {
      "type": "EXPLICIT" | "IMPLIED",
      "title": "Risk title",
      "description": "Details",
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "evidence": {
        "claim": "Risk description",
        "sourceDoc": "filename.md",
        "excerpt": "verbatim text from doc",
        "confidence": 0.95
      }
    }
  ],
  "blockers": [
    {
      "title": "Blocker title",
      "category": "REGULATORY" | "INFRASTRUCTURE" | "TECHNICAL" | "BILLING" | "TRAINING" | "PROCUREMENT",
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "details": "Details",
      "evidence": {
        "claim": "Blocker description",
        "sourceDoc": "filename.md",
        "excerpt": "verbatim text from doc",
        "confidence": 0.95
      }
    }
  ],
  "opportunity": {
    "status": "HIGH" | "MEDIUM" | "LOW" | "TRAP" | "NONE",
    "potential": "e.g. 15+ docks tender ($100k+) or null",
    "details": "Details",
    "isTrap": false,
    "trapReason": null,
    "evidence": [
      {
        "claim": "Opportunity claim",
        "sourceDoc": "filename.md",
        "excerpt": "verbatim text from doc",
        "confidence": 0.95
      }
    ]
  },
  "winBack": {
    "isChurned": true | false,
    "churnReason": "Root cause or null",
    "viability": "HIGH" | "MODERATE" | "LOW" | "NOT_APPLICABLE",
    "requiredConditions": ["Condition 1", "Condition 2"],
    "evidence": {
      "claim": "Churn/winback claim",
      "sourceDoc": "filename.md",
      "excerpt": "verbatim text from doc",
      "confidence": 0.95
    }
  },
  "nextBestActions": [
    {
      "action": "Concrete next step for GTM team",
      "priority": "P0" | "P1" | "P2",
      "reason": "Why this action matters now",
      "expectedOutcome": "Tangible business outcome",
      "evidence": [
        {
          "claim": "Action justification",
          "sourceDoc": "filename.md",
          "excerpt": "verbatim text from doc",
          "confidence": 0.95
        }
      ]
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const latencyMs = Date.now() - startTime;
    const responseText = response.text || "{}";

    let parsedJson: any;
    try {
      parsedJson = JSON.parse(responseText);
    } catch (parseErr: any) {
      throw new Error(`Gemini returned non-JSON output: ${parseErr.message}`);
    }

    const validation = IntelligenceValidator.validate(parsedJson, context);
    if (!validation.isValid || !validation.validated) {
      throw new Error(
        `Gemini output failed validation: ${validation.errors.join(", ")}`
      );
    }

    const usageMetadata = response.usageMetadata;

    return {
      intelligence: validation.validated,
      observability: {
        providerUsed: "gemini",
        modelUsed: this.modelName,
        latencyMs,
        tokensUsed: usageMetadata
          ? {
              promptTokens: usageMetadata.promptTokenCount,
              completionTokens: usageMetadata.candidatesTokenCount,
              totalTokens: usageMetadata.totalTokenCount,
            }
          : undefined,
        usedFallback: false,
      },
    };
  }
}
