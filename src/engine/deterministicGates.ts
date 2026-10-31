import { EvidencePack, GateVerdict, PracticeTradeRecord } from "../types/lexcontrol"

export function evaluateEightDeterministicGates(evidence: EvidencePack): {
  gateVerdicts: GateVerdict[]
  ucc12ExclusiveControl: boolean
  ucc9326ASuperPriority: boolean
  section12106DischargeBlocked: boolean
  practiceTrade: PracticeTradeRecord
} {
  const ryo = evidence.ryo
  const venues = evidence.venues
  const reg = evidence.legal_registries
  const f = evidence.cre_onchain_facility

  // Gate 1: Source Freshness (TTL <= 300s) & Null-Safety Invariant
  const g1Pass =
    ryo.deep_analysis.age_seconds <= 300 &&
    ryo.deep_analysis.data.ryo_spot_price_usd !== null &&
    ryo.deep_analysis.data.atr_14_usd !== null
  const gate1: GateVerdict = {
    gate_number: 1,
    gate_name: "Source Freshness & Null-Safety Invariant",
    statutory_or_market_authority: "RYO-CHAN Honesty Specification & CRE 300s TTL",
    condition_expression: "age_seconds <= 300 && price !== null && atr !== null (null != 0)",
    status: g1Pass ? "PASS" : "HALT",
    short_circuit_code: g1Pass ? "OK_FRESH_AND_NON_NULL" : "ERR_TTL_STALE_OR_NULL_FIELD",
    observed_value_summary: `age=${ryo.deep_analysis.age_seconds}s, spot=$${ryo.deep_analysis.data.ryo_spot_price_usd}, atr=$${ryo.deep_analysis.data.atr_14_usd}`,
  }

  // Gate 2: Cross-Venue Basis Check (<= 200 bps)
  const basisBps = venues.cross_venue_basis_bps ?? 9999
  const g2Pass = basisBps <= 200
  const gate2: GateVerdict = {
    gate_number: 2,
    gate_name: "Cross-Venue Basis & Price Integrity",
    statutory_or_market_authority: "RYO-CHAN vs. Coinbase / Binance Spot Consensus",
    condition_expression: "cross_venue_basis_bps <= 200",
    status: g2Pass ? "PASS" : "HALT",
    short_circuit_code: g2Pass ? "OK_BASIS_WITHIN_200BPS" : "ERR_BASIS_MISMATCH_200BPS",
    observed_value_summary: `basis=${basisBps} bps (Coinbase=$${venues.coinbase_spot_usd}, Binance=$${venues.binance_spot_usd})`,
  }

  // Gate 3: RYO-CHAN check_safety & Untrusted Text Guard
  const g3Pass =
    !ryo.check_safety.data.is_honeypot &&
    !ryo.check_safety.data.sanctions_flag &&
    ryo.check_safety.data.critical_risk_count === 0 &&
    ryo.monitor_market_sentiment_shift.data.narrative_headline.sanitized
  const gate3: GateVerdict = {
    gate_number: 3,
    gate_name: "RYO-CHAN check_safety & Prompt-Injection Guard",
    statutory_or_market_authority: "RYO-CHAN check_safety MCP Tool & OFAC/Sanctions Check",
    condition_expression: "is_honeypot == false && sanctions_flag == false && sanitized == true",
    status: g3Pass ? "PASS" : "HALT",
    short_circuit_code: g3Pass ? "OK_SAFETY_VERIFIED" : "ERR_SAFETY_HONEYPOT_FLAG",
    observed_value_summary: `verdict=${ryo.check_safety.data.audit_verdict}, critical_risks=${ryo.check_safety.data.critical_risk_count}`,
  }

  // Gate 4: GLEIF LEI Active Entity Verification
  const g4Pass = reg.gleif_status === "ISSUED" && reg.gleif_lei.length === 20
  const gate4: GateVerdict = {
    gate_number: 4,
    gate_name: "GLEIF Golden Copy LEI Verification",
    statutory_or_market_authority: "ISO 17442 GLEIF Legal Entity Identifier Registry",
    condition_expression: "gleif_status == 'ISSUED' && lei.length == 20",
    status: g4Pass ? "PASS" : "HALT",
    short_circuit_code: g4Pass ? "OK_GLEIF_LEI_ISSUED" : "ERR_LEI_LAPSED_OR_UNVERIFIED",
    observed_value_summary: `LEI=${reg.gleif_lei} (${reg.gleif_status}, ${reg.gleif_entity_category})`,
  }

  // Gate 5: NY UCC §§ 12-105(c) Control Exclusivity, 12-102(a)(3) Value, 8-103(i) Non-Article-8 & 12-106(d)(3) Discharge Check
  const ucc12ExclusiveControl =
    !f.transferor_cosign_required_12_105_c_2_b && !f.transferor_can_act_unilaterally_12_105_c_2_a
  const g5Pass =
    ucc12ExclusiveControl &&
    f.is_cpi_undertaking_9_102_27b &&
    f.is_excluded_from_article_8_103_i &&
    f.disbursed_value_usd_12_102_a_3 > 0 &&
    f.is_valid_12_106_single_payee_notice
  const gate5: GateVerdict = {
    gate_number: 5,
    gate_name: "NY UCC §§ 12-105(c) Control, 12-102(a)(3) Value, 8-103(i) & 12-106 Discharge Check",
    statutory_or_market_authority:
      "NY UCC §§ 12-102(a)(3), 12-104(e), 12-105(a)-(c), 12-106(b)-(g), 8-103(i), 9-102(a)(27B)",
    condition_expression:
      "exclusive_12_105 && value_3_303a > 0 && !art8_opt_in && valid_12_106_single_payee",
    status: g5Pass ? "PASS" : "WARN_ROUTE",
    short_circuit_code: g5Pass
      ? "OK_UCC12_EXCLUSIVE_CONTROL_AND_VALUE"
      : "WARN_UCC_12_105C_TRANSFEROR_TAINT",
    observed_value_summary: `exclusive=${ucc12ExclusiveControl}, value=$${f.disbursed_value_usd_12_102_a_3}, nonArt8=${f.is_excluded_from_article_8_103_i}, valid12106=${f.is_valid_12_106_single_payee_notice}`,
  }

  // Gate 6: NY UCC § 12-107(c) Governing Law Waterfall
  const g6Pass = f.waterfall_step_12_107_c >= 1 && f.waterfall_step_12_107_c <= 5
  const gate6: GateVerdict = {
    gate_number: 6,
    gate_name: "NY UCC § 12-107(c) Governing Law Waterfall",
    statutory_or_market_authority: "NY UCC § 12-107(c)(1)-(5) & (e) No-Relation Rule",
    condition_expression: "waterfall_step in [1..5] (Step 1 Express CER Jurisdiction)",
    status: g6Pass ? "PASS" : "HALT",
    short_circuit_code: g6Pass
      ? "OK_UCC_12_107_STEP_1_NY"
      : "ERR_UCC_12_107_JURISDICTION_VOID",
    observed_value_summary: `Step ${f.waterfall_step_12_107_c}: ${f.governing_jurisdiction_12_107}`,
  }

  // Gate 7: 11 U.S.C. § 362(a) Automatic Stay vs. §§ 546(e)/555/559/560 Safe-Harbor & NY UCC § 9-208(b)(8) Router
  const isPayoffRelease = f.outstanding_debt_usd === 0 && f.debtor_signed_demand_timestamp > 0
  const isSafeHarbor = f.contract_safe_harbor_type > 0
  let g7Code = "OK_SAFE_HARBOR_559_CLOSEOUT_AND_12_106_LOCK"
  let g7Status: "PASS" | "WARN_ROUTE" = "PASS"

  if (isPayoffRelease) {
    g7Code = "ROUTE_UCC_9_208_B_8_MANDATORY_10DAY_RELEASE"
    g7Status = "PASS"
  } else if (!ucc12ExclusiveControl) {
    g7Code = "ROUTE_DEFENSIVE_HEDGE_ON_12_105C_TAINT"
    g7Status = "WARN_ROUTE"
  } else if (!isSafeHarbor) {
    g7Code = "ROUTE_11USC_362A_STAY_HOLD_OFF_ESTATE_HEDGE"
    g7Status = "WARN_ROUTE"
  }

  const gate7: GateVerdict = {
    gate_number: 7,
    gate_name: "11 U.S.C. § 362(a) Stay vs. §§ 555/559/560 Safe-Harbor & § 9-208(b)(8) Router",
    statutory_or_market_authority:
      "11 U.S.C. §§ 362(a), 365(e), 546(e), 555, 559, 560; UK Sch. 4ZZA para. 13; NY UCC § 9-208(b)(8)",
    condition_expression: "Routes Safe-Harbor Closeout vs. § 362(a) Stay Hold vs. § 9-208 Release",
    status: g7Status,
    short_circuit_code: g7Code,
    observed_value_summary: `safeHarborType=${f.contract_safe_harbor_type}, debt=$${f.outstanding_debt_usd}, demandTs=${f.debtor_signed_demand_timestamp}`,
  }

  // Gate 8: ATR Position Sizing & 2:1 R/R Portfolio Constraint
  const virtualBalance = 100000
  const allocatedUsd = isPayoffRelease ? 0 : 10000
  const allocPct = (allocatedUsd / virtualBalance) * 100
  const spot = ryo.deep_analysis.data.ryo_spot_price_usd ?? 2500
  const atr = ryo.deep_analysis.data.atr_14_usd ?? 60
  const stopLoss = Number((spot + 1.5 * atr).toFixed(2))
  const takeProfit = Number((spot - 3.0 * atr).toFixed(2))
  const rrRatio = 2.0

  const g8Pass = allocPct <= 10.0 && rrRatio >= 2.0
  const gate8: GateVerdict = {
    gate_number: 8,
    gate_name: "ATR Practice Position Sizing & Risk/Reward Cap",
    statutory_or_market_authority: "RYO-CHAN Practice Portfolio Risk Rules ($100k Virtual Balance)",
    condition_expression: "allocation <= 10% ($10,000) && Stop == 1.5 ATR && Target == +2R",
    status: g8Pass ? "PASS" : "HALT",
    short_circuit_code: g8Pass ? "OK_ATR_RISK_BRACKET_LOCKED" : "ERR_ATR_RISK_LIMIT_EXCEEDED",
    observed_value_summary: isPayoffRelease
      ? "Alloc=$0 (0% — Control Release Mode)"
      : `Alloc=$${allocatedUsd} (${allocPct}%), Entry=$${spot}, Stop=$${stopLoss} (-1.5 ATR), Target=$${takeProfit} (+2R)`,
  }

  const ucc9326ASuperPriority = g5Pass && g6Pass
  const section12106DischargeBlocked =
    !isPayoffRelease && ucc12ExclusiveControl && isSafeHarbor && f.is_valid_12_106_single_payee_notice

  let statutoryActionCode: 1 | 2 | 3 | 4 = 1
  let actionLabel: PracticeTradeRecord["action_label"] = "SAFE_HARBOR_CLOSEOUT_AND_12_106_LOCK"

  if (isPayoffRelease) {
    statutoryActionCode = 4
    actionLabel = "MANDATORY_UCC_9_208_CONTROL_RELEASE_NO_TRADE"
  } else if (!ucc12ExclusiveControl) {
    statutoryActionCode = 3
    actionLabel = "DEFENSIVE_12_105C_TAINT_HEDGE"
  } else if (!isSafeHarbor) {
    statutoryActionCode = 2
    actionLabel = "AUTOMATIC_STAY_HOLD_PLUS_OFF_ESTATE_MACRO_HEDGE"
  } else {
    statutoryActionCode = 1
    actionLabel = "SAFE_HARBOR_CLOSEOUT_AND_12_106_LOCK"
  }

  const practiceTrade: PracticeTradeRecord = {
    executed_on_practice_ledger: !isPayoffRelease,
    action_label: actionLabel,
    statutory_action_code: statutoryActionCode,
    direction: isPayoffRelease ? "NONE" : "SHORT_HEDGE",
    virtual_portfolio_balance_usd: virtualBalance,
    allocated_notional_usd: allocatedUsd,
    allocation_pct: allocPct,
    entry_price_usd: isPayoffRelease ? null : spot,
    stop_loss_1_5_atr_usd: isPayoffRelease ? null : stopLoss,
    take_profit_2r_usd: isPayoffRelease ? null : takeProfit,
    reward_to_risk_ratio: isPayoffRelease ? null : rrRatio,
  }

  return {
    gateVerdicts: [gate1, gate2, gate3, gate4, gate5, gate6, gate7, gate8],
    ucc12ExclusiveControl,
    ucc9326ASuperPriority,
    section12106DischargeBlocked,
    practiceTrade,
  }
}

