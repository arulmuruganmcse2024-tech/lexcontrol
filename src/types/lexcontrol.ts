export type DataMode = "recorded" | "live"

export interface RyoToolEnvelope<T> {
  tool:
    | "market_overview"
    | "scan_market"
    | "analyze_token"
    | "deep_analysis"
    | "compare_tokens"
    | "check_safety"
    | "supported_tokens"
    | "monitor_market_sentiment_shift"
  as_of: string
  age_seconds: number
  data_mode: DataMode
  source_status: "OK" | "DEGRADED_UNAVAILABLE"
  trace_id: string
  data: T
}

export interface UntrustedTextEnvelope {
  untrusted: string
  sanitized: boolean
  control_chars_stripped: number
  source_url: string
}

export interface EvidencePack {
  preset_id: number
  preset_name: string
  preset_subtitle: string
  captured_at_iso: string
  don_timestamp_sec: number
  data_mode: DataMode
  ryo: {
    market_overview: RyoToolEnvelope<{
      regime: "RISK_ON" | "RISK_OFF_DISTRESSED" | "NEUTRAL"
      btc_dominance_pct: number | null
      total_volume_24h_usd: number | null
    }>
    deep_analysis: RyoToolEnvelope<{
      symbol: string
      ryo_spot_price_usd: number | null
      atr_14_usd: number | null
      trade_plan: {
        entry_usd: number | null
        stop_1_5_atr_usd: number | null
        target_2r_usd: number | null
        reward_risk_ratio: number | null
      }
    }>
    check_safety: RyoToolEnvelope<{
      is_honeypot: boolean
      sanctions_flag: boolean
      critical_risk_count: number
      audit_verdict: "SAFE" | "CRITICAL_FLAG"
    }>
    monitor_market_sentiment_shift: RyoToolEnvelope<{
      sentiment_delta_score: number | null
      narrative_headline: UntrustedTextEnvelope
    }>
  }
  venues: {
    coinbase_spot_usd: number | null
    binance_spot_usd: number | null
    cross_venue_basis_bps: number | null
  }
  legal_registries: {
    gleif_lei: string
    gleif_status: "ISSUED" | "LAPSED" | "PENDING"
    gleif_entity_category: "FINANCIAL_INSTITUTION_REPO_PARTICIPANT" | "CORPORATE_BORROWER_NON_EXEMPT"
    sec_edgar_8k_item: "ITEM_1_03_BANKRUPTCY_OR_RECEIVERSHIP" | "ITEM_2_04_ACCELERATION" | "NONE"
    sec_edgar_filing_excerpt: UntrustedTextEnvelope
    uk_gazette_insolvency_notice: boolean
  }
  cre_onchain_facility: {
    chain_selector_name: string
    finality_mode: "LAST_FINALIZED_BLOCK_NUMBER"
    finalized_block_number: number
    contract_address: string
    facility_id: string
    is_cpi_undertaking_9_102_27b: boolean
    is_excluded_from_article_8_103_i: boolean
    disbursed_value_usd_12_102_a_3: number
    transferor_cosign_required_12_105_c_2_b: boolean
    transferor_can_act_unilaterally_12_105_c_2_a: boolean
    has_exclusive_control_12_105: boolean
    is_valid_12_106_single_payee_notice: boolean
    waterfall_step_12_107_c: number
    governing_jurisdiction_12_107: string
    contract_safe_harbor_type: 0 | 1 | 2 | 3 // 0=Non-Exempt, 1=11 USC 559 Repo, 2=11 USC 560 Swap, 3=11 USC 555 Sec
    uk_schedule_4zza_para_13_excluded: boolean
    outstanding_debt_usd: number
    debtor_signed_demand_timestamp: number
    control_released_to_debtor: boolean
  }
}

export interface VerifiedCitation {
  json_path: string
  readback_value: string | number | boolean | null
  verified: boolean
  explanation: string
}

export interface AgentOpinion {
  agent_id: "MARKET_BASIS_AGENT" | "UCC12_BANKRUPTCY_COUNSEL_AGENT"
  agent_title: string
  brier_score_7d: number
  calibration_weight: number
  proposed_stance: "SHORT_HEDGE" | "LONG_REBALANCE" | "NO_TRADE_RELEASE_CONTROL"
  confidence: number
  thesis: string
  citations: VerifiedCitation[]
}

export interface JudgeRuling {
  ruling_stance: "SHORT_HEDGE" | "LONG_REBALANCE" | "NO_TRADE_RELEASE_CONTROL"
  combined_conviction: number
  accepted_arguments: string[]
  explicit_rejections: string[]
  cause_and_effect_summary: string
  citations: VerifiedCitation[]
}

export interface GateVerdict {
  gate_number: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  gate_name: string
  statutory_or_market_authority: string
  condition_expression: string
  status: "PASS" | "WARN_ROUTE" | "HALT"
  short_circuit_code: string
  observed_value_summary: string
}

export interface PracticeTradeRecord {
  executed_on_practice_ledger: boolean
  action_label:
    | "SAFE_HARBOR_CLOSEOUT_AND_12_106_LOCK"
    | "AUTOMATIC_STAY_HOLD_PLUS_OFF_ESTATE_MACRO_HEDGE"
    | "DEFENSIVE_12_105C_TAINT_HEDGE"
    | "MANDATORY_UCC_9_208_CONTROL_RELEASE_NO_TRADE"
  statutory_action_code: 1 | 2 | 3 | 4
  direction: "SHORT_HEDGE" | "NONE"
  virtual_portfolio_balance_usd: number
  allocated_notional_usd: number
  allocation_pct: number
  entry_price_usd: number | null
  stop_loss_1_5_atr_usd: number | null
  take_profit_2r_usd: number | null
  reward_to_risk_ratio: number | null
}

export interface DecisionReceipt {
  receipt_id: string
  seq: number
  prev_hash: string
  rolling_hash: string
  evidence_merkle_root: string
  preset_id: number
  captured_at_iso: string
  don_timestamp_sec: number
  data_mode: DataMode
  evidence: EvidencePack
  council_opinions: AgentOpinion[]
  judge_ruling: JudgeRuling
  gate_verdicts: GateVerdict[]
  ucc12_exclusive_control: boolean
  ucc9_326a_super_priority: boolean
  section_12_106_discharge_blocked: boolean
  practice_trade: PracticeTradeRecord
  sepolia_anchor: {
    key_forwarder_address: string
    mock_forwarder_address: string
    consumer_contract_address: string
    controllable_asset_address: string
    workflow_id: string
    report_id_bytes2: string
    tx_hash: string
  }
}

