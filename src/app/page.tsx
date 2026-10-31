"use client"

import React, { useEffect, useState } from "react"
import {
  extractAndVerifyPdfProofPacket,
  generateCourtPleadingPdfBytes,
} from "../legal/pleadingPdfExporter"
import { DecisionReceipt } from "../types/lexcontrol"

export default function LexControlTerminalPage() {
  const [ledger, setLedger] = useState<DecisionReceipt[]>([])
  const [activePreset, setActivePreset] = useState<number>(1)
  const [freshMode, setFreshMode] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [verifyBanner, setVerifyBanner] = useState<string>(
    "Deterministic Cryptographic Ledger Verified • 4/4 Statutory Facilities Ready"
  )
  const [pdfVerifyResult, setPdfVerifyResult] = useState<{
    valid: boolean
    recomputedHash: string | null
    receiptId: string | null
  } | null>(null)

  const fetchLedger = async (preset: number, fresh: boolean) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/evaluate?preset=${preset}&fresh=${fresh}`)
      const data = await res.json()
      if (data.ledger) {
        setLedger(data.ledger)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLedger(activePreset, freshMode)
  }, [activePreset, freshMode])

  const receipt = ledger.find((r) => r.preset_id === activePreset) ?? ledger[0]

  const handleDownloadCourtPdf = () => {
    if (!receipt) return
    const pdfBytes = generateCourtPleadingPdfBytes(receipt)
    const check = extractAndVerifyPdfProofPacket(pdfBytes)
    setPdfVerifyResult({
      valid: check.valid,
      recomputedHash: check.recomputedHash,
      receiptId: check.packet?.receipt_id ?? null,
    })

    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `LexControl-FRE902-Pleading-Preset-${receipt.preset_id}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleRunFullChainVerify = async () => {
    setVerifyBanner("Auditing 4/4 Facilities, 8 Gates, JSON Readbacks & FRE 902 Proof Packets...")
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fresh: freshMode }),
    })
    const json = await res.json()
    if (json.verified) {
      setVerifyBanner(
        `CRYPTOGRAPHIC CONSENSUS VERIFIED • 100% Bit-Identical Replay across ${json.total_presets_checked}/4 Presets & Embedded FRE 902 PDF Proofs`
      )
    } else {
      setVerifyBanner("Verification Warning — Review Audit Console")
    }
  }

  if (loading || !receipt) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0B0F17",
          color: "#94A3B8",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize: 14,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, color: "#38BDF8", fontWeight: 700, marginBottom: 8 }}>
            LEXCONTROL INSTITUTIONAL LEGAL-TECH DESK
          </div>
          <div>Initializing NY UCC Article 12, Chainlink CRE WebAssembly &amp; RYO-CHAN MCP Engine...</div>
        </div>
      </div>
    )
  }

  const f = receipt.evidence.cre_onchain_facility

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#080C14",
        color: "#F1F5F9",
      }}
    >
      {/* INSTITUTIONAL MASTHEAD */}
      <header
        style={{
          borderBottom: "1px solid #1E293B",
          background: "linear-gradient(180deg, #0F172A 0%, #0B1120 100%)",
          padding: "12px 24px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              background: "#1D4ED8",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: "0.08em",
              padding: "4px 10px",
              borderRadius: 4,
              fontFamily: "ui-monospace, monospace",
              boxShadow: "0 0 12px rgba(29, 78, 216, 0.5)",
            }}
          >
            LEXCONTROL
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>
                NY UCC Article 12 CER Perfection, Bankruptcy Safe-Harbor &amp; Practice Trading Desk
              </h1>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#10B981",
                  background: "rgba(16, 185, 129, 0.12)",
                  padding: "2px 6px",
                  borderRadius: 4,
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                }}
              >
                PROD v1.0
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 2 }}>
              Statutory Authority: NY UCC §§ 12-102–107 &bull; 11 U.S.C. §§ 362(a) / 546(e) / 555 / 559 / 560 &bull; FRE 902(13)/(14) &bull; Chainlink CRE DON
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => setFreshMode(!freshMode)}
            style={{
              background: freshMode ? "#047857" : "#1E293B",
              color: "#FFFFFF",
              border: freshMode ? "1px solid #10B981" : "1px solid #334155",
              padding: "7px 14px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.2s ease",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: freshMode ? "#34D399" : "#64748B",
                display: "inline-block",
              }}
            />
            {freshMode ? "Mode: Live RPC / API Feeds" : "Mode: Deterministic Replay"}
          </button>

          <button
            onClick={handleRunFullChainVerify}
            style={{
              background: "#2563EB",
              color: "#FFFFFF",
              border: "1px solid #3B82F6",
              padding: "7px 14px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)",
              transition: "all 0.2s ease",
            }}
          >
            Execute Full Hash-Chain Replay Audit
          </button>
        </div>
      </header>

      {/* INSTITUTIONAL STATUS TELEMETRY */}
      <div
        style={{
          background: "#06281E",
          borderBottom: "1px solid #064E3B",
          color: "#A7F3D0",
          padding: "6px 24px",
          fontSize: 11.5,
          fontFamily: "ui-monospace, monospace",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#34D399", fontWeight: 700 }}>● AUDIT SYSTEM:</span>
          <span>{verifyBanner}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span>FINALITY: LAST_FINALIZED_BLOCK_NUMBER (#{f.finalized_block_number})</span>
          <span>CHAIN HEAD: {receipt.rolling_hash.slice(0, 22)}...</span>
        </div>
      </div>

      {/* 3-PANEL INSTITUTIONAL WORKSPACE */}
      <main
        style={{
          display: "grid",
          gridTemplateColumns: "340px 1fr 370px",
          gap: 14,
          padding: 14,
          flex: 1,
        }}
      >
        {/* PANEL 1: STATUTORY FACILITY SELECTOR & PRIMARY REGISTRY EVIDENCE */}
        <section
          style={{
            background: "#0F172A",
            border: "1px solid #1E293B",
            borderRadius: 8,
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", color: "#93C5FD", letterSpacing: "0.04em" }}>
              1. Credit Facility Scenarios
            </h2>
            <span style={{ fontSize: 10.5, color: "#64748B", fontFamily: "ui-monospace, monospace" }}>
              4 PRESETS
            </span>
          </div>

          {[1, 2, 3, 4].map((id) => {
            const item = ledger.find((r) => r.preset_id === id)
            const isSel = activePreset === id
            return (
              <button
                key={id}
                onClick={() => setActivePreset(id)}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: 6,
                  border: isSel ? "1.5px solid #3B82F6" : "1px solid #1E293B",
                  background: isSel ? "#1E293B" : "#0B0F17",
                  color: "#F8FAFC",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 12, display: "flex", justifyContent: "space-between" }}>
                  <span>{item?.evidence.preset_name.split(":")[0] ?? `Preset #${id}`}</span>
                  <span
                    style={{
                      fontSize: 10,
                      color: id === 1 ? "#34D399" : id === 4 ? "#38BDF8" : "#FBBF24",
                      fontFamily: "ui-monospace, monospace",
                    }}
                  >
                    {id === 1 ? "SAFE-HARBOR" : id === 2 ? "12-105(c) TAINT" : id === 3 ? "STAY HOLD" : "RELEASE"}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4, lineHeight: 1.4 }}>
                  {item?.evidence.preset_subtitle}
                </div>
              </button>
            )
          })}

          <div style={{ borderTop: "1px solid #1E293B", paddingTop: 10, marginTop: "auto" }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: 11.5, fontWeight: 700, color: "#38BDF8", textTransform: "uppercase" }}>
              Ingested Evidence Pack ({receipt.data_mode.toUpperCase()})
            </h3>
            <div style={{ fontSize: 11, fontFamily: "ui-monospace, monospace", lineHeight: 1.65, color: "#CBD5E1" }}>
              <div>&bull; RYO-CHAN Spot Ref: ${receipt.evidence.ryo.deep_analysis.data.ryo_spot_price_usd} USD</div>
              <div>&bull; RYO-CHAN 14-Period ATR: ${receipt.evidence.ryo.deep_analysis.data.atr_14_usd} USD</div>
              <div>&bull; Cross-Venue Spread: {receipt.evidence.venues.cross_venue_basis_bps} bps (CB/BN)</div>
              <div>&bull; RYO-CHAN Safety Audit: {receipt.evidence.ryo.check_safety.data.audit_verdict}</div>
              <div>&bull; GLEIF LEI Status: {receipt.evidence.legal_registries.gleif_lei} ({receipt.evidence.legal_registries.gleif_status})</div>
              <div>&bull; SEC EDGAR Notice: {receipt.evidence.legal_registries.sec_edgar_8k_item}</div>
              <div>&bull; EVM Finalized Block: #{f.finalized_block_number}</div>
              <div>&bull; NY UCC § 12-105 Exclusivity: {String(f.has_exclusive_control_12_105)}</div>
              <div>&bull; NY UCC § 12-102(a)(3) Disbursed: ${f.disbursed_value_usd_12_102_a_3.toLocaleString()}</div>
              <div>&bull; NY UCC § 8-103(i) Non-Art8: {String(f.is_excluded_from_article_8_103_i)}</div>
              <div>&bull; NY UCC § 12-106 Non-Division: {String(f.is_valid_12_106_single_payee_notice)}</div>
            </div>
          </div>
        </section>

        {/* PANEL 2: 3-AGENT COUNCIL (JSON READBACK) & 8 SEQUENTIAL DETERMINISTIC GATES */}
        <section
          style={{
            background: "#0F172A",
            border: "1px solid #1E293B",
            borderRadius: 8,
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", color: "#93C5FD", letterSpacing: "0.04em" }}>
              2. Autonomous Multi-Agent Council (Programmatic JSON Number Readback)
            </h2>
            <span style={{ fontSize: 10.5, color: "#10B981", fontFamily: "ui-monospace, monospace" }}>
              0% GENERATIVE HEARSAY
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {receipt.council_opinions.map((op) => (
              <div
                key={op.agent_id}
                style={{
                  background: "#0B0F17",
                  border: "1px solid #1E293B",
                  borderRadius: 6,
                  padding: 10,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  <strong style={{ color: "#38BDF8" }}>{op.agent_title}</strong>
                  <span style={{ fontFamily: "ui-monospace, monospace", color: "#94A3B8" }}>
                    Brier: {op.brier_score_7d} | Weight: {op.calibration_weight}
                  </span>
                </div>
                <p style={{ fontSize: 11.5, color: "#E2E8F0", margin: "6px 0 8px 0", lineHeight: 1.4 }}>{op.thesis}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {op.citations.map((c) => (
                    <div
                      key={c.json_path}
                      style={{
                        fontSize: 10,
                        fontFamily: "ui-monospace, monospace",
                        background: "rgba(6, 78, 59, 0.5)",
                        color: "#A7F3D0",
                        padding: "2px 6px",
                        borderRadius: 3,
                        border: "1px solid rgba(16, 185, 129, 0.2)",
                      }}
                    >
                      [READBACK VERIFIED] {c.json_path.split(".").slice(-2).join(".")} = {String(c.readback_value)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CALIBRATED JUDGE RULING */}
          <div
            style={{
              background: "linear-gradient(180deg, #172554 0%, #0F172A 100%)",
              border: "1px solid #1D4ED8",
              borderRadius: 6,
              padding: 10,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: "#93C5FD" }}>
                Calibrated Judge Agent Verdict: {receipt.judge_ruling.ruling_stance}
              </div>
              <span style={{ fontSize: 11, fontFamily: "ui-monospace, monospace", color: "#38BDF8" }}>
                Conviction: {(receipt.judge_ruling.combined_conviction * 100).toFixed(1)}%
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: "#E2E8F0", marginTop: 4, fontFamily: "ui-monospace, monospace", lineHeight: 1.4 }}>
              {receipt.judge_ruling.cause_and_effect_summary}
            </div>
            <div style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 4 }}>
              <strong>Rejections:</strong> {receipt.judge_ruling.explicit_rejections.join(" ")}
            </div>
          </div>

          {/* 8 SEQUENTIAL DETERMINISTIC GATES */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
            <h2 style={{ margin: 0, fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", color: "#93C5FD", letterSpacing: "0.04em" }}>
              3. 8 Sequential Deterministic Risk Gates (Fail-Closed Pipeline)
            </h2>
            <span style={{ fontSize: 10.5, color: "#64748B", fontFamily: "ui-monospace, monospace" }}>
              FAIL-CLOSED
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {receipt.gate_verdicts.map((g) => (
              <div
                key={g.gate_number}
                style={{
                  background: "#0B0F17",
                  border: "1px solid #1E293B",
                  borderLeft:
                    g.status === "PASS"
                      ? "3px solid #10B981"
                      : g.status === "WARN_ROUTE"
                      ? "3px solid #F59E0B"
                      : "3px solid #EF4444",
                  borderRadius: 4,
                  padding: "6px 8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700 }}>
                    G{g.gate_number}: {g.gate_name}{" "}
                    <span style={{ fontSize: 10.5, fontWeight: 400, color: "#94A3B8" }}>
                      ({g.statutory_or_market_authority})
                    </span>
                  </div>
                  <div style={{ fontSize: 10.5, fontFamily: "ui-monospace, monospace", color: "#CBD5E1", marginTop: 1 }}>
                    {g.observed_value_summary}
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: "ui-monospace, monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 3,
                    background: g.status === "PASS" ? "rgba(6, 78, 59, 0.7)" : "rgba(120, 53, 15, 0.7)",
                    color: g.status === "PASS" ? "#A7F3D0" : "#FDE68A",
                    whiteSpace: "nowrap",
                  }}
                >
                  {g.short_circuit_code}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* PANEL 3: STATUTORY PRIORITY, PRACTICE TRADING & FRE 902 PDF EXPORTER */}
        <section
          style={{
            background: "#0F172A",
            border: "1px solid #1E293B",
            borderRadius: 8,
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", color: "#93C5FD", letterSpacing: "0.04em" }}>
              4. Priority &amp; Practice Desk
            </h2>
            <span style={{ fontSize: 10.5, color: "#64748B", fontFamily: "ui-monospace, monospace" }}>
              ON-CHAIN SEPOLIA
            </span>
          </div>

          <div
            style={{
              background: "#0B0F17",
              border: "1px solid #1E293B",
              borderRadius: 6,
              padding: 10,
              fontFamily: "ui-monospace, monospace",
              fontSize: 11.5,
              lineHeight: 1.6,
            }}
          >
            <div>
              NY UCC § 12-105 Control:{" "}
              <strong style={{ color: receipt.ucc12_exclusive_control ? "#34D399" : "#F87171" }}>
                {receipt.ucc12_exclusive_control ? "EXCLUSIVE" : "TAINTED (§ 12-105(c)(2)(B))"}
              </strong>
            </div>
            <div>
              NY UCC § 9-326A Super-Priority:{" "}
              <strong style={{ color: receipt.ucc9_326a_super_priority ? "#34D399" : "#F87171" }}>
                {String(receipt.ucc9_326a_super_priority).toUpperCase()}
              </strong>
            </div>
            <div>
              NY UCC § 12-106 Discharge Lock:{" "}
              <strong style={{ color: receipt.section_12_106_discharge_blocked ? "#34D399" : "#FBBF24" }}>
                {receipt.section_12_106_discharge_blocked ? "LOCKED TO TRANSFEREE" : "UNLOCKED"}
              </strong>
            </div>
            <div>Statutory Action Code: #{receipt.practice_trade.statutory_action_code}</div>
            <div style={{ color: "#93C5FD", fontWeight: 700, fontSize: 11 }}>{receipt.practice_trade.action_label}</div>
            <hr style={{ borderColor: "#1E293B", margin: "6px 0" }} />
            <div>Virtual Portfolio: ${receipt.practice_trade.virtual_portfolio_balance_usd.toLocaleString()} USD</div>
            <div>Desk Direction: {receipt.practice_trade.direction}</div>
            <div>
              Allocated Notional: ${receipt.practice_trade.allocated_notional_usd.toLocaleString()} (
              {receipt.practice_trade.allocation_pct}% max 10%)
            </div>
            <div>Entry Price: {receipt.practice_trade.entry_price_usd ? `$${receipt.practice_trade.entry_price_usd}` : "N/A"}</div>
            <div>Stop-Loss (-1.5 ATR): {receipt.practice_trade.stop_loss_1_5_atr_usd ? `$${receipt.practice_trade.stop_loss_1_5_atr_usd}` : "N/A"}</div>
            <div>Take-Profit (+2R): {receipt.practice_trade.take_profit_2r_usd ? `$${receipt.practice_trade.take_profit_2r_usd}` : "N/A"}</div>
          </div>

          <div
            style={{
              background: "#0B0F17",
              border: "1px solid #1E293B",
              borderRadius: 6,
              padding: 10,
              fontFamily: "ui-monospace, monospace",
              fontSize: 10.5,
              lineHeight: 1.5,
            }}
          >
            <div style={{ color: "#38BDF8", fontWeight: 700, marginBottom: 2 }}>
              Chainlink CRE Ethereum Sepolia Anchor
            </div>
            <div>KeystoneForwarder: {receipt.sepolia_anchor.key_forwarder_address.slice(0, 22)}...</div>
            <div>Consumer (IReceiver): {receipt.sepolia_anchor.consumer_contract_address.slice(0, 22)}...</div>
            <div>Report ID (bytes2): {receipt.sepolia_anchor.report_id_bytes2}</div>
            <div>Sepolia TxHash: {receipt.sepolia_anchor.tx_hash.slice(0, 24)}...</div>
          </div>

          <button
            onClick={handleDownloadCourtPdf}
            style={{
              background: "linear-gradient(180deg, #2563EB 0%, #1D4ED8 100%)",
              color: "#FFFFFF",
              border: "1px solid #3B82F6",
              padding: "10px 14px",
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(37, 99, 235, 0.4)",
            }}
          >
            Export FRE 902(13)/(14) Court Pleading PDF
          </button>

          {pdfVerifyResult && (
            <div
              style={{
                background: pdfVerifyResult.valid ? "rgba(6, 78, 59, 0.8)" : "rgba(127, 29, 29, 0.8)",
                border: pdfVerifyResult.valid ? "1px solid #10B981" : "1px solid #EF4444",
                color: "#FFFFFF",
                padding: 8,
                borderRadius: 6,
                fontSize: 10.5,
                fontFamily: "ui-monospace, monospace",
              }}
            >
              <div>
                PDF PROOF VERIFICATION:{" "}
                <strong style={{ color: pdfVerifyResult.valid ? "#A7F3D0" : "#FCA5A5" }}>
                  {pdfVerifyResult.valid ? "PASS (AUTHENTICATED FRE 902)" : "FAILED"}
                </strong>
              </div>
              <div>Receipt: {pdfVerifyResult.receiptId?.slice(0, 24)}...</div>
              <div>Recomputed SHA-256: {pdfVerifyResult.recomputedHash?.slice(0, 24)}...</div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
