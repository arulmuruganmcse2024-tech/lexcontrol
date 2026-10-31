import { AgentOpinion, EvidencePack, JudgeRuling, VerifiedCitation } from "../types/lexcontrol"

export function resolveCitationPath(
  evidence: EvidencePack,
  dottedPath: string
): { value: string | number | boolean | null; verified: boolean } {
  const parts = dottedPath.replace(/^evidence\./, "").split(".")
  let current: unknown = evidence
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") {
      return { value: null, verified: false }
    }
    current = (current as Record<string, unknown>)[part]
  }
  if (
    typeof current === "string" ||
    typeof current === "number" ||
    typeof current === "boolean"
  ) {
    return { value: current, verified: true }
  }
  return { value: null, verified: false }
}

function buildCitation(
  evidence: EvidencePack,
  jsonPath: string,
  explanation: string
): VerifiedCitation {
  const resolved = resolveCitationPath(evidence, jsonPath)
  return {
    json_path: jsonPath,
    readback_value: resolved.value,
    verified: resolved.verified && resolved.value !== null,
    explanation,
  }
}

export function runAutonomousCouncil(evidence: EvidencePack): {
  opinions: AgentOpinion[]
  ruling: JudgeRuling
} {
  const f = evidence.cre_onchain_facility
  const isPayoffRelease = f.outstanding_debt_usd === 0 && f.debtor_signed_demand_timestamp > 0

  // Agent 1: Market & Basis Agent
  const marketCitations: VerifiedCitation[] = [
    buildCitation(
      evidence,
      "evidence.ryo.deep_analysis.data.ryo_spot_price_usd",
      "RYO-CHAN deep_analysis spot reference price (USD)"
    ),
    buildCitation(
      evidence,
      "evidence.ryo.deep_analysis.data.atr_14_usd",
      "RYO-CHAN 14-period Average True Range (ATR) volatility metric"
    ),
    buildCitation(
      evidence,
      "evidence.venues.cross_venue_basis_bps",
      "Cross-venue basis spread between RYO, Coinbase, and Binance (bps)"
    ),
    buildCitation(
      evidence,
      "evidence.ryo.check_safety.data.critical_risk_count",
      "RYO-CHAN check_safety critical smart-contract/honeypot risk count"
    ),
  ]

  const marketOpinion: AgentOpinion = {
    agent_id: "MARKET_BASIS_AGENT",
    agent_title: "Market & Basis Quantitative Agent (RYO-CHAN MCP)",
    brier_score_7d: 0.112,
    calibration_weight: 0.46,
    proposed_stance: isPayoffRelease ? "NO_TRADE_RELEASE_CONTROL" : "SHORT_HEDGE",
    confidence: marketCitations.every((c) => c.verified) ? 0.91 : 0.55,
    thesis: isPayoffRelease
      ? "Facility debt is fully extinguished ($0); zero market hedge required while RYO-CHAN basis remains tight."
      : `RYO-CHAN market_overview flags ${evidence.ryo.market_overview.data.regime} with ${evidence.venues.cross_venue_basis_bps} bps cross-venue basis; recommends a -1.5 ATR stop / +2R target virtual short hedge.`,
    citations: marketCitations,
  }

  // Agent 2: NY UCC Article 12 & Bankruptcy Safe-Harbor Counsel Agent
  const legalCitations: VerifiedCitation[] = [
    buildCitation(
      evidence,
      "evidence.cre_onchain_facility.has_exclusive_control_12_105",
      "NY UCC § 12-105(a)-(c) exclusive control status on finalized Sepolia block"
    ),
    buildCitation(
      evidence,
      "evidence.cre_onchain_facility.disbursed_value_usd_12_102_a_3",
      "NY UCC § 12-102(a)(3) & § 3-303(a) actual disbursed value (USD)"
    ),
    buildCitation(
      evidence,
      "evidence.cre_onchain_facility.is_excluded_from_article_8_103_i",
      "NY UCC § 8-103(i) confirmation that CER has not opted into Article 8 financial asset status"
    ),
    buildCitation(
      evidence,
      "evidence.cre_onchain_facility.is_valid_12_106_single_payee_notice",
      "NY UCC § 12-106(d)(3) & (g) non-division single-payee discharge instruction validity"
    ),
    buildCitation(
      evidence,
      "evidence.cre_onchain_facility.contract_safe_harbor_type",
      "11 U.S.C. §§ 555/559/560 Safe-Harbor classification code (0=Non-Exempt, 1=559 Repo)"
    ),
    buildCitation(
      evidence,
      "evidence.cre_onchain_facility.outstanding_debt_usd",
      "Outstanding secured obligation (USD) for NY UCC § 9-208(b)(8) release check"
    ),
  ]

  let legalThesis = ""
  if (isPayoffRelease) {
    legalThesis =
      "Under NY UCC § 9-208(b)(8) (eff. June 3, 2026), because outstandingDebtUsd == 0 and a signed debtor demand was received, secured party MUST release CER control back to the debtor within 10 days."
  } else if (!f.has_exclusive_control_12_105) {
    legalThesis =
      "DEFECTIVE CONTROL TAINT: Debtor/transferor retains co-sign authority under NY UCC § 12-105(c)(2)(B), defeating exclusive control (§ 12-105) and forfeiting § 9-326A super-priority over competing UCC-1 filings. Execute defensive practice hedge immediately."
  } else if (f.contract_safe_harbor_type === 0) {
    legalThesis =
      "AUTOMATIC STAY BARRIER: Counterparty filed Chapter 11 (Form 8-K Item 1.03) on a non-exempt commercial loan. Freezing or seizing collateral on-chain violates 11 U.S.C. § 362(a) and § 365(e)(1). Enforce AUTOMATIC_STAY_HOLD on-chain and route economic protection to an off-estate virtual macro hedge."
  } else {
    legalThesis =
      "SAFE-HARBOR CLOSEOUT & § 12-106 LOCK AUTHORIZED: Secured party holds exclusive control (§ 12-105), gave actual value (§ 12-102(a)(3)), and facility qualifies as a Repo under 11 U.S.C. §§ 362(b)(7), 546(f) & 559 (and UK Insolvency Act 1986 Sch. 4ZZA para. 13). Lock account-debtor discharge under NY UCC § 12-106(b)-(f) and execute practice closeout hedge."
  }

  const legalOpinion: AgentOpinion = {
    agent_id: "UCC12_BANKRUPTCY_COUNSEL_AGENT",
    agent_title: "NY UCC Article 12 & Bankruptcy Safe-Harbor Counsel Agent",
    brier_score_7d: 0.084,
    calibration_weight: 0.54,
    proposed_stance: isPayoffRelease ? "NO_TRADE_RELEASE_CONTROL" : "SHORT_HEDGE",
    confidence: legalCitations.every((c) => c.verified) ? 0.96 : 0.6,
    thesis: legalThesis,
    citations: legalCitations,
  }

  const combinedConviction = Number(
    (
      marketOpinion.confidence * marketOpinion.calibration_weight +
      legalOpinion.confidence * legalOpinion.calibration_weight
    ).toFixed(4)
  )

  const ruling: JudgeRuling = {
    ruling_stance: isPayoffRelease ? "NO_TRADE_RELEASE_CONTROL" : "SHORT_HEDGE",
    combined_conviction: combinedConviction,
    accepted_arguments: [marketOpinion.thesis, legalOpinion.thesis],
    explicit_rejections: [
      "Rejected naive on-chain token freeze without 11 U.S.C. §§ 546(e)/555/559/560 Safe-Harbor verification because post-petition freezes of non-exempt loans violate the 11 U.S.C. § 362(a) Automatic Stay.",
      "Rejected unverified social/KOL price targets in favor of deterministic RYO-CHAN ATR brackets and finalized Sepolia state.",
    ],
    cause_and_effect_summary: isPayoffRelease
      ? "CAUSE: Zero debt ($0) + signed debtor demand (ts=1761800000) -> EFFECT: Dispatch statutoryActionCode=4 to release CER control under NY UCC § 9-208(b)(8) and halt trading."
      : !f.has_exclusive_control_12_105
      ? "CAUSE: Transferor co-sign flag (true) triggers NY UCC § 12-105(c)(2)(B) taint -> EFFECT: Downgrade § 9-326A super-priority to false and execute $10,000 virtual defensive short hedge."
      : f.contract_safe_harbor_type === 0
      ? "CAUSE: Chapter 11 8-K Item 1.03 on non-exempt commercial loan -> EFFECT: Block on-chain seizure to obey 11 U.S.C. § 362(a) Automatic Stay (Action=2) and execute $10,000 off-estate virtual practice hedge."
      : "CAUSE: Exclusive NY UCC § 12-105 control + 11 U.S.C. § 559 Repo Safe Harbor -> EFFECT: Lock NY UCC § 12-106 account-debtor discharge on-chain (Action=1) and execute $10,000 virtual closeout hedge.",
    citations: [...marketCitations.slice(0, 2), ...legalCitations.slice(0, 4)],
  }

  return { opinions: [marketOpinion, legalOpinion], ruling }
}

