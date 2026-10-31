import { EvidencePack } from "../types/lexcontrol"

export function sanitizeUntrustedText(raw: string, sourceUrl: string) {
  // Strip Unicode control characters and bidirectional override characters
  const regex = /[\u0000-\u001F\u007F-\u009F\u200E\u200F\u202A-\u202E\u2066-\u2069]/g
  const matches = raw.match(regex)
  const cleaned = raw.replace(regex, "")
  return {
    untrusted: cleaned,
    sanitized: true,
    control_chars_stripped: matches ? matches.length : 0,
    source_url: sourceUrl,
  }
}

export const RECORDED_EVIDENCE_PRESETS: Record<number, EvidencePack> = {
  1: {
    preset_id: 1,
    preset_name: "Preset 1: Valid NY UCC § 12-105 Exclusive Control + 11 U.S.C. § 559 Repo Safe Harbor",
    preset_subtitle:
      "Qualifying Repo Participant under 11 U.S.C. §§ 362(b)(7), 546(f) & 559; executes Safe-Harbor Closeout & NY UCC § 12-106(b)-(f) Account-Debtor Discharge Lock.",
    captured_at_iso: "2026-10-30T14:00:00.000Z",
    don_timestamp_sec: 1761832800,
    data_mode: "recorded",
    ryo: {
      market_overview: {
        tool: "market_overview",
        as_of: "2026-10-30T13:59:10.000Z",
        age_seconds: 50,
        data_mode: "recorded",
        source_status: "OK",
        trace_id: "ryo-trace-p1-overview",
        data: {
          regime: "RISK_OFF_DISTRESSED",
          btc_dominance_pct: 56.4,
          total_volume_24h_usd: 94200000000,
        },
      },
      deep_analysis: {
        tool: "deep_analysis",
        as_of: "2026-10-30T13:59:15.000Z",
        age_seconds: 45,
        data_mode: "recorded",
        source_status: "OK",
        trace_id: "ryo-trace-p1-deep",
        data: {
          symbol: "ETH",
          ryo_spot_price_usd: 2520.0,
          atr_14_usd: 60.0,
          trade_plan: {
            entry_usd: 2520.0,
            stop_1_5_atr_usd: 2610.0,
            target_2r_usd: 2340.0,
            reward_risk_ratio: 2.0,
          },
        },
      },
      check_safety: {
        tool: "check_safety",
        as_of: "2026-10-30T13:59:20.000Z",
        age_seconds: 40,
        data_mode: "recorded",
        source_status: "OK",
        trace_id: "ryo-trace-p1-safety",
        data: {
          is_honeypot: false,
          sanctions_flag: false,
          critical_risk_count: 0,
          audit_verdict: "SAFE",
        },
      },
      monitor_market_sentiment_shift: {
        tool: "monitor_market_sentiment_shift",
        as_of: "2026-10-30T13:59:25.000Z",
        age_seconds: 35,
        data_mode: "recorded",
        source_status: "OK",
        trace_id: "ryo-trace-p1-sentiment",
        data: {
          sentiment_delta_score: -0.68,
          narrative_headline: sanitizeUntrustedText(
            "Institutional repo desk reports collateral stress following issuer Form 8-K Item 2.04 notice.",
            "https://www.sec.gov/edgar/searchedgar/companysearch"
          ),
        },
      },
    },
    venues: {
      coinbase_spot_usd: 2521.5,
      binance_spot_usd: 2519.0,
      cross_venue_basis_bps: 10,
    },
    legal_registries: {
      gleif_lei: "5493001KJTIIGC8Y1R12",
      gleif_status: "ISSUED",
      gleif_entity_category: "FINANCIAL_INSTITUTION_REPO_PARTICIPANT",
      sec_edgar_8k_item: "ITEM_2_04_ACCELERATION",
      sec_edgar_filing_excerpt: sanitizeUntrustedText(
        "Form 8-K Item 2.04: Triggering Events That Accelerate or Increase a Direct Financial Obligation under Master Repurchase Agreement.",
        "https://www.sec.gov/Archives/edgar/data/0001/8k-repo-2026.txt"
      ),
      uk_gazette_insolvency_notice: false,
    },
    cre_onchain_facility: {
      chain_selector_name: "ethereum-testnet-sepolia",
      finality_mode: "LAST_FINALIZED_BLOCK_NUMBER",
      finalized_block_number: 7184920,
      contract_address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      facility_id: "0x1111111111111111111111111111111111111111111111111111111111111111",
      is_cpi_undertaking_9_102_27b: true,
      is_excluded_from_article_8_103_i: true,
      disbursed_value_usd_12_102_a_3: 5000000,
      transferor_cosign_required_12_105_c_2_b: false,
      transferor_can_act_unilaterally_12_105_c_2_a: false,
      has_exclusive_control_12_105: true,
      is_valid_12_106_single_payee_notice: true,
      waterfall_step_12_107_c: 1,
      governing_jurisdiction_12_107: "State of New York",
      contract_safe_harbor_type: 1,
      uk_schedule_4zza_para_13_excluded: true,
      outstanding_debt_usd: 5000000,
      debtor_signed_demand_timestamp: 0,
      control_released_to_debtor: false,
    },
  },
  2: {
    preset_id: 2,
    preset_name: "Preset 2: Defective Shared Control — NY UCC § 12-105(c)(2)(B) Transferor Co-Sign Taint",
    preset_subtitle:
      "Debtor/transferor retains co-sign power on smart contract transfers, defeating § 12-105 exclusive control and § 9-326A super-priority; triggers defensive practice hedge.",
    captured_at_iso: "2026-10-30T14:15:00.000Z",
    don_timestamp_sec: 1761833700,
    data_mode: "recorded",
    ryo: {
      market_overview: {
        tool: "market_overview",
        as_of: "2026-10-30T14:14:10.000Z",
        age_seconds: 50,
        data_mode: "recorded",
        source_status: "OK",
        trace_id: "ryo-trace-p2-overview",
        data: {
          regime: "RISK_OFF_DISTRESSED",
          btc_dominance_pct: 56.8,
          total_volume_24h_usd: 95100000000,
        },
      },
      deep_analysis: {
        tool: "deep_analysis",
        as_of: "2026-10-30T14:14:15.000Z",
        age_seconds: 45,
        data_mode: "recorded",
        source_status: "OK",
        trace_id: "ryo-trace-p2-deep",
        data: {
          symbol: "ETH",
          ryo_spot_price_usd: 2500.0,
          atr_14_usd: 58.0,
          trade_plan: {
            entry_usd: 2500.0,
            stop_1_5_atr_usd: 2587.0,
            target_2r_usd: 2326.0,
            reward_risk_ratio: 2.0,
          },
        },
      },
      check_safety: {
        tool: "check_safety",
        as_of: "2026-10-30T14:14:20.000Z",
        age_seconds: 40,
        data_mode: "recorded",
        source_status: "OK",
        trace_id: "ryo-trace-p2-safety",
        data: {
          is_honeypot: false,
          sanctions_flag: false,
          critical_risk_count: 0,
          audit_verdict: "SAFE",
        },
      },
      monitor_market_sentiment_shift: {
        tool: "monitor_market_sentiment_shift",
        as_of: "2026-10-30T14:14:25.000Z",
        age_seconds: 35,
        data_mode: "recorded",
        source_status: "OK",
        trace_id: "ryo-trace-p2-sentiment",
        data: {
          sentiment_delta_score: -0.52,
          narrative_headline: sanitizeUntrustedText(
            "Competing UCC-1 financing statement creditor challenges multi-sig collateral control exclusivity under NY UCC § 12-105(c)(2)(B).",
            "https://www.nysenate.gov/legislation/laws/UCC/12-105"
          ),
        },
      },
    },
    venues: {
      coinbase_spot_usd: 2501.0,
      binance_spot_usd: 2499.5,
      cross_venue_basis_bps: 6,
    },
    legal_registries: {
      gleif_lei: "5493001KJTIIGC8Y1R12",
      gleif_status: "ISSUED",
      gleif_entity_category: "CORPORATE_BORROWER_NON_EXEMPT",
      sec_edgar_8k_item: "NONE",
      sec_edgar_filing_excerpt: sanitizeUntrustedText(
        "No bankruptcy filing; priority audit triggered by competing UCC-1 financing statement search.",
        "https://appext20.dos.ny.gov/pls/ucc_public/web_search.main_frame"
      ),
      uk_gazette_insolvency_notice: false,
    },
    cre_onchain_facility: {
      chain_selector_name: "ethereum-testnet-sepolia",
      finality_mode: "LAST_FINALIZED_BLOCK_NUMBER",
      finalized_block_number: 7184995,
      contract_address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      facility_id: "0x2222222222222222222222222222222222222222222222222222222222222222",
      is_cpi_undertaking_9_102_27b: true,
      is_excluded_from_article_8_103_i: true,
      disbursed_value_usd_12_102_a_3: 3500000,
      transferor_cosign_required_12_105_c_2_b: true,
      transferor_can_act_unilaterally_12_105_c_2_a: false,
      has_exclusive_control_12_105: false,
      is_valid_12_106_single_payee_notice: true,
      waterfall_step_12_107_c: 1,
      governing_jurisdiction_12_107: "State of New York",
      contract_safe_harbor_type: 0,
      uk_schedule_4zza_para_13_excluded: false,
      outstanding_debt_usd: 3500000,
      debtor_signed_demand_timestamp: 0,
      control_released_to_debtor: false,
    },
  },
  3: {
    preset_id: 3,
    preset_name: "Preset 3: Chapter 11 Filing on Non-Exempt Loan — 11 U.S.C. § 362(a) Automatic Stay Hold",
    preset_subtitle:
      "Form 8-K Item 1.03 Bankruptcy detected on non-exempt commercial loan; blocks illegal on-chain freeze (§ 362(a) / § 365(e)(1)) and routes to off-estate virtual macro hedge.",
    captured_at_iso: "2026-10-30T14:30:00.000Z",
    don_timestamp_sec: 1761834600,
    data_mode: "recorded",
    ryo: {
      market_overview: {
        tool: "market_overview",
        as_of: "2026-10-30T14:29:10.000Z",
        age_seconds: 50,
        data_mode: "recorded",
        source_status: "OK",
        trace_id: "ryo-trace-p3-overview",
        data: {
          regime: "RISK_OFF_DISTRESSED",
          btc_dominance_pct: 57.2,
          total_volume_24h_usd: 98400000000,
        },
      },
      deep_analysis: {
        tool: "deep_analysis",
        as_of: "2026-10-30T14:29:15.000Z",
        age_seconds: 45,
        data_mode: "recorded",
        source_status: "OK",
        trace_id: "ryo-trace-p3-deep",
        data: {
          symbol: "ETH",
          ryo_spot_price_usd: 2480.0,
          atr_14_usd: 64.0,
          trade_plan: {
            entry_usd: 2480.0,
            stop_1_5_atr_usd: 2576.0,
            target_2r_usd: 2288.0,
            reward_risk_ratio: 2.0,
          },
        },
      },
      check_safety: {
        tool: "check_safety",
        as_of: "2026-10-30T14:29:20.000Z",
        age_seconds: 40,
        data_mode: "recorded",
        source_status: "OK",
        trace_id: "ryo-trace-p3-safety",
        data: {
          is_honeypot: false,
          sanctions_flag: false,
          critical_risk_count: 0,
          audit_verdict: "SAFE",
        },
      },
      monitor_market_sentiment_shift: {
        tool: "monitor_market_sentiment_shift",
        as_of: "2026-10-30T14:29:25.000Z",
        age_seconds: 35,
        data_mode: "recorded",
        source_status: "OK",
        trace_id: "ryo-trace-p3-sentiment",
        data: {
          sentiment_delta_score: -0.84,
          narrative_headline: sanitizeUntrustedText(
            "Corporate borrower files voluntary Chapter 11 petition in SDNY; automatic stay under 11 U.S.C. § 362(a) immediately in force.",
            "https://www.sec.gov/edgar/searchedgar/companysearch"
          ),
        },
      },
    },
    venues: {
      coinbase_spot_usd: 2482.0,
      binance_spot_usd: 2479.0,
      cross_venue_basis_bps: 12,
    },
    legal_registries: {
      gleif_lei: "5493001KJTIIGC8Y1R12",
      gleif_status: "ISSUED",
      gleif_entity_category: "CORPORATE_BORROWER_NON_EXEMPT",
      sec_edgar_8k_item: "ITEM_1_03_BANKRUPTCY_OR_RECEIVERSHIP",
      sec_edgar_filing_excerpt: sanitizeUntrustedText(
        "Form 8-K Item 1.03: Voluntary Petition for Non-Individuals Filing for Bankruptcy (Chapter 11) filed in S.D.N.Y.",
        "https://www.sec.gov/Archives/edgar/data/0003/8k-ch11-2026.txt"
      ),
      uk_gazette_insolvency_notice: false,
    },
    cre_onchain_facility: {
      chain_selector_name: "ethereum-testnet-sepolia",
      finality_mode: "LAST_FINALIZED_BLOCK_NUMBER",
      finalized_block_number: 7185050,
      contract_address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      facility_id: "0x3333333333333333333333333333333333333333333333333333333333333333",
      is_cpi_undertaking_9_102_27b: true,
      is_excluded_from_article_8_103_i: true,
      disbursed_value_usd_12_102_a_3: 8000000,
      transferor_cosign_required_12_105_c_2_b: false,
      transferor_can_act_unilaterally_12_105_c_2_a: false,
      has_exclusive_control_12_105: true,
      is_valid_12_106_single_payee_notice: true,
      waterfall_step_12_107_c: 1,
      governing_jurisdiction_12_107: "State of New York",
      contract_safe_harbor_type: 0,
      uk_schedule_4zza_para_13_excluded: false,
      outstanding_debt_usd: 8000000,
      debtor_signed_demand_timestamp: 0,
      control_released_to_debtor: false,
    },
  },
  4: {
    preset_id: 4,
    preset_name: "Preset 4: Paid-Off Facility + Signed Demand — NY UCC § 9-208(b)(8) 10-Day Control Release",
    preset_subtitle:
      "Secured obligation satisfied in full ($0 debt) and signed debtor demand received; CRE automatically releases CER control back to debtor within 10-day statutory window.",
    captured_at_iso: "2026-10-30T14:45:00.000Z",
    don_timestamp_sec: 1761835500,
    data_mode: "recorded",
    ryo: {
      market_overview: {
        tool: "market_overview",
        as_of: "2026-10-30T14:44:10.000Z",
        age_seconds: 50,
        data_mode: "recorded",
        source_status: "OK",
        trace_id: "ryo-trace-p4-overview",
        data: {
          regime: "NEUTRAL",
          btc_dominance_pct: 55.9,
          total_volume_24h_usd: 81000000000,
        },
      },
      deep_analysis: {
        tool: "deep_analysis",
        as_of: "2026-10-30T14:44:15.000Z",
        age_seconds: 45,
        data_mode: "recorded",
        source_status: "OK",
        trace_id: "ryo-trace-p4-deep",
        data: {
          symbol: "ETH",
          ryo_spot_price_usd: 2550.0,
          atr_14_usd: 50.0,
          trade_plan: {
            entry_usd: 2550.0,
            stop_1_5_atr_usd: 2625.0,
            target_2r_usd: 2400.0,
            reward_risk_ratio: 2.0,
          },
        },
      },
      check_safety: {
        tool: "check_safety",
        as_of: "2026-10-30T14:44:20.000Z",
        age_seconds: 40,
        data_mode: "recorded",
        source_status: "OK",
        trace_id: "ryo-trace-p4-safety",
        data: {
          is_honeypot: false,
          sanctions_flag: false,
          critical_risk_count: 0,
          audit_verdict: "SAFE",
        },
      },
      monitor_market_sentiment_shift: {
        tool: "monitor_market_sentiment_shift",
        as_of: "2026-10-30T14:44:25.000Z",
        age_seconds: 35,
        data_mode: "recorded",
        source_status: "OK",
        trace_id: "ryo-trace-p4-sentiment",
        data: {
          sentiment_delta_score: 0.15,
          narrative_headline: sanitizeUntrustedText(
            "Borrower completes final payoff wire and submits signed demand for release of control under NY UCC § 9-208(b)(8).",
            "https://codes.findlaw.com/ny/uniform-commercial-code/ucc-sect-9-208/"
          ),
        },
      },
    },
    venues: {
      coinbase_spot_usd: 2550.5,
      binance_spot_usd: 2549.5,
      cross_venue_basis_bps: 4,
    },
    legal_registries: {
      gleif_lei: "5493001KJTIIGC8Y1R12",
      gleif_status: "ISSUED",
      gleif_entity_category: "FINANCIAL_INSTITUTION_REPO_PARTICIPANT",
      sec_edgar_8k_item: "NONE",
      sec_edgar_filing_excerpt: sanitizeUntrustedText(
        "Obligation satisfied; zero outstanding balance confirmed on facility ledger.",
        "https://codes.findlaw.com/ny/uniform-commercial-code/ucc-sect-9-208/"
      ),
      uk_gazette_insolvency_notice: false,
    },
    cre_onchain_facility: {
      chain_selector_name: "ethereum-testnet-sepolia",
      finality_mode: "LAST_FINALIZED_BLOCK_NUMBER",
      finalized_block_number: 7185110,
      contract_address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      facility_id: "0x4444444444444444444444444444444444444444444444444444444444444444",
      is_cpi_undertaking_9_102_27b: true,
      is_excluded_from_article_8_103_i: true,
      disbursed_value_usd_12_102_a_3: 2000000,
      transferor_cosign_required_12_105_c_2_b: false,
      transferor_can_act_unilaterally_12_105_c_2_a: false,
      has_exclusive_control_12_105: true,
      is_valid_12_106_single_payee_notice: true,
      waterfall_step_12_107_c: 1,
      governing_jurisdiction_12_107: "State of New York",
      contract_safe_harbor_type: 1,
      uk_schedule_4zza_para_13_excluded: true,
      outstanding_debt_usd: 0,
      debtor_signed_demand_timestamp: 1761800000,
      control_released_to_debtor: false,
    },
  },
}

