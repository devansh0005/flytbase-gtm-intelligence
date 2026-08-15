import { QualitativeIntelligenceOutput, LLMContextInput } from "./types";
import { EvidenceReference } from "@/lib/intelligence/types";

export class IntelligenceValidator {
  public static validate(
    data: any,
    context: LLMContextInput
  ): { isValid: boolean; validated?: QualitativeIntelligenceOutput; errors: string[] } {
    const errors: string[] = [];

    if (!data || typeof data !== "object") {
      return { isValid: false, errors: ["Output is not a valid JSON object"] };
    }

    // Valid health values
    const validHealths = ["HEALTHY", "WATCH", "AT_RISK", "CRITICAL", "CHURNED"];
    if (!validHealths.includes(data.reconciledHealth)) {
      errors.push(`Invalid reconciledHealth: ${data.reconciledHealth}`);
    }

    // Valid sentiment values
    const validSentiments = ["POSITIVE", "NEUTRAL", "CONCERNED", "NEGATIVE"];
    if (!validSentiments.includes(data.sentiment)) {
      data.sentiment = "NEUTRAL";
    }

    const availableFilesSet = new Set(context.availableDocumentFiles);
    const collectedEvidence: EvidenceReference[] = [];

    // Helper to validate and sanitize an EvidenceReference
    const sanitizeEvidence = (ev: any, fieldName: string): EvidenceReference | null => {
      if (!ev || typeof ev !== "object") {
        errors.push(`Missing evidence object for ${fieldName}`);
        return null;
      }

      const sourceDoc = String(ev.sourceDoc || "").trim();
      const excerpt = String(ev.excerpt || "").trim();
      const claim = String(ev.claim || "").trim();
      const confidence = typeof ev.confidence === "number" ? Math.max(0, Math.min(1, ev.confidence)) : 0.9;

      if (!sourceDoc || !availableFilesSet.has(sourceDoc)) {
        // If file doesn't match exactly, find closest or record error
        const match = context.availableDocumentFiles.find(
          (f) => f.toLowerCase() === sourceDoc.toLowerCase() || sourceDoc.includes(f)
        );
        if (match) {
          ev.sourceDoc = match;
        } else {
          errors.push(`Evidence references nonexistent document: "${sourceDoc}" in ${fieldName}`);
          return null;
        }
      }

      if (!excerpt || excerpt.length < 5) {
        errors.push(`Evidence has empty or trivial excerpt in ${fieldName}`);
        return null;
      }

      const validatedEv: EvidenceReference = {
        claim: claim || fieldName,
        sourceDoc: ev.sourceDoc,
        excerpt,
        confidence,
      };

      collectedEvidence.push(validatedEv);
      return validatedEv;
    };

    // Validate Stakeholders
    const validatedStakeholders = Array.isArray(data.stakeholders)
      ? data.stakeholders.map((s: any, idx: number) => {
          const ev = sanitizeEvidence(s.evidence, `stakeholder[${s.name || idx}]`);
          return {
            name: String(s.name || "Unknown"),
            role: String(s.role || "Stakeholder"),
            department: s.department ? String(s.department) : undefined,
            authorityLevel: s.authorityLevel || "OPERATOR",
            sentiment: s.sentiment || "NEUTRAL",
            isLikelyChampion: Boolean(s.isLikelyChampion),
            notes: s.notes ? String(s.notes) : undefined,
            evidence: ev || {
              claim: `Role: ${s.name}`,
              sourceDoc: context.availableDocumentFiles[0] || "01_account_profile.md",
              excerpt: `Stakeholder: ${s.name}`,
              confidence: 0.8,
            },
          };
        })
      : [];

    // Validate Risks
    const validatedRisks = Array.isArray(data.risks)
      ? data.risks
          .map((r: any, idx: number) => {
            const ev = sanitizeEvidence(r.evidence, `risk[${r.title || idx}]`);
            if (!ev) return null;
            return {
              type: r.type === "IMPLIED" ? "IMPLIED" : "EXPLICIT",
              title: String(r.title || "Risk"),
              description: String(r.description || ""),
              severity: r.severity || "MEDIUM",
              evidence: ev,
            };
          })
          .filter(Boolean)
      : [];

    // Validate Blockers
    const validatedBlockers = Array.isArray(data.blockers)
      ? data.blockers
          .map((b: any, idx: number) => {
            const ev = sanitizeEvidence(b.evidence, `blocker[${b.title || idx}]`);
            if (!ev) return null;
            return {
              title: String(b.title || "Blocker"),
              category: b.category || "TECHNICAL",
              severity: b.severity || "MEDIUM",
              details: String(b.details || ""),
              evidence: ev,
            };
          })
          .filter(Boolean)
      : [];

    // Validate Opportunity
    const opp = data.opportunity || {};
    const validOppStatuses = ["HIGH", "MEDIUM", "LOW", "TRAP", "NONE"];
    const validatedOpp = {
      status: (validOppStatuses.includes(opp.status) ? opp.status : "NONE") as any,
      potential: opp.potential ? String(opp.potential) : undefined,
      details: String(opp.details || "No active expansion identified."),
      isTrap: Boolean(opp.isTrap),
      trapReason: opp.trapReason ? String(opp.trapReason) : undefined,
      evidence: Array.isArray(opp.evidence)
        ? opp.evidence.map((e: any, i: number) => sanitizeEvidence(e, `opportunity[${i}]`)).filter(Boolean)
        : [],
    };

    // Validate WinBack
    const wb = data.winBack || {};
    const validViabilities = ["HIGH", "MODERATE", "LOW", "NOT_APPLICABLE"];
    const validatedWinBack = {
      isChurned: Boolean(wb.isChurned || context.deterministicSignals.hasCrmHealthDisconnect),
      churnReason: wb.churnReason ? String(wb.churnReason) : undefined,
      viability: (validViabilities.includes(wb.viability) ? wb.viability : "NOT_APPLICABLE") as any,
      requiredConditions: Array.isArray(wb.requiredConditions) ? wb.requiredConditions.map(String) : [],
      evidence: sanitizeEvidence(wb.evidence, "winBack") || {
        claim: "Account status",
        sourceDoc: context.availableDocumentFiles[0] || "01_account_profile.md",
        excerpt: `Account Category: ${context.crmRecord.category}`,
        confidence: 0.9,
      },
    };

    // Validate Next Best Actions
    const validatedActions = Array.isArray(data.nextBestActions)
      ? data.nextBestActions.map((a: any, idx: number) => ({
          action: String(a.action || "CS Cadence Review"),
          priority: (["P0", "P1", "P2"].includes(a.priority) ? a.priority : "P1") as any,
          reason: String(a.reason || "Operational review"),
          expectedOutcome: String(a.expectedOutcome || "Account stabilization"),
          evidence: Array.isArray(a.evidence)
            ? a.evidence.map((e: any, i: number) => sanitizeEvidence(e, `action[${idx}].evidence[${i}]`)).filter(Boolean)
            : [],
        }))
      : [];

    if (errors.length > 5) {
      return { isValid: false, errors };
    }

    return {
      isValid: true,
      validated: {
        reconciledHealth: data.reconciledHealth,
        healthRationale: String(data.healthRationale || "Evaluated by Intelligence Engine."),
        topRiskFactors: Array.isArray(data.topRiskFactors) ? data.topRiskFactors.map(String) : [],
        contradictions: Array.isArray(data.contradictions) ? data.contradictions.map(String) : [],
        sentiment: data.sentiment,
        stakeholders: validatedStakeholders,
        likelyChampion: data.likelyChampion ? String(data.likelyChampion) : null,
        risks: validatedRisks as any,
        blockers: validatedBlockers as any,
        opportunity: validatedOpp as any,
        winBack: validatedWinBack,
        nextBestActions: validatedActions,
        allEvidence: collectedEvidence,
      },
      errors,
    };
  }
}
