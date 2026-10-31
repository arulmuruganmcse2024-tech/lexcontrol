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
    "All 4 Statutory Presets & SHA-256 Hash Chain Ready"
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
    setVerifyBanner("Verifying 4/4 Presets, 8 Gates, JSON Readbacks & FRE 902 PDF Proofs...")
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fresh: freshMode }),
    })
    const json = await res.json()
    if (json.verified) {
      setVerifyBanner(
        `VERIFIED PASS (identical: true across ${json.total_presets_checked}/4 Presets & Embedded FRE 902 PDF Proofs)`
      )
    } else {
      setVerifyBanner("Verification Warning — Inspect Console")
    }
  }

  if (loading || !receipt) {
    return (
      <div style={{ padding: 32, color: "#94A3B8", fontFamily: "monospace" }}>
        Initializing LexControl NY UCC Article 12, Chainlink CRE &amp; RYO-CHAN MCP Desk...
      </div>
    )
  }

  const f = receipt.evidence.cre_onchain_facility

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* TOP INSTITUTIONAL HEADER */}
      <header
        style={{
          borderBottom: "1px solid #1E293B",
          background: "#0F172A",
          padding: "14px 20px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                background: "#2563EB",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: 12,
                padding: "3px 8px",
                borderRadius: 4,
                fontFamily: "monospace",
              }}
            >
              LEXCONTROL v1.0
            </span>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
              NY UCC Article 12 CER Perfection, Bankruptcy Safe-Harbor &amp; Practice Trading Desk
            </h1>
          </div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>
            Chainlink CRE WASM (Sepolia Finalized Reads + KeystoneForwarder) &bull; RYO-CHAN Read-Only MCP &bull; FRE 902(13)/(14) Pleading Exporter
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => setFreshMode(!freshMode)}
            style={{
              background: freshMode ? "#059669" : "#1E293B",
              color: "#FFFFFF",
              border: "1px solid #334155",
              padding: "7px 12px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Mode: {freshMode ? "LIVE RPC / GLEIF / VENUE API (--fresh)" : "RECORDED DETERMINISTIC REPLAY"}
          </button>

          <button
            onClick={handleRunFullChainVerify}
            style={{
              background: "#1D4ED8",
              color: "#FFFFFF",
              border: "1px solid #3B82F6",
              padding: "7px 12px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Run Zero-Key Replay Verifier (4/4 Presets)
          </button>
        </div>
      </header>

      {/* VERIFICATION STATUS BAR */}
      <div
        style={{
          background: "#064E3B",
          color: "#A7F3D0",
          padding: "7px 20px",
          fontSize: 12,
          fontFamily: "monospace",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <span>STATUS: {verifyBanner}</span>
        <span>ROLLING LEDGER HEAD: {receipt.rolling_hash.slice(0, 26)}...</span>
      </div>

      {/* 3-PANEL INSTITUTIONAL WORKSPACE */}
      <main
        style={{
          display: "grid",
          gridTemplateColumns: "330px 1fr 360px",
          gap: 14,
          padding: 14,
          flex: 1,
        }}
      >
        {/* LEFT PANEL: 4 STATUTORY PRESETS & PRIMARY EVIDENCE SOURCES */}
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
          <h2 style={{ margin: 0, fontSize: 13, textTransform: "uppercase", color: "#93C5FD" }}>
            1. Statutory Scenario Presets (One-Click)
          </h2>
          {[1, 2, 3, 4].map((id) => {
            const item = ledger.find((r) => r.preset_id === id)
            const isSel = activePreset === id
            return (
              <button
                key={id}
                onClick={() => setActivePreset(id)}
                style={{
                  textAlign: "left",
                  padding: 10,
                  borderRadius: 6,
                  border: isSel ? "2px solid #3B82F6" : "1px solid #1E293B",
                  background: isSel ? "#1E293B" : "#0B0F17",
                  color: "#F8FAFC",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 12.5 }}>
                  {item?.evidence.preset_name ?? `Preset #${id}`}
                </div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>
                  {item?.evidence.preset_subtitle}
                </div>
              </button>
            )
          })}

          <div style={{ borderTop: "1px solid #1E293B", paddingTop: 10 }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: 12, color: "#38BDF8" }}>
              Ingested Primary Evidence Pack ({receipt.data_mode.toUpperCase()})
            </h3>
            <div style={{ fontSize: 11.5, fontFamily: "monospace", lineHeight: 1.6, color: "#CBD5E1" }}>
              <div>&bull; RYO Spot: ${receipt.evidence.ryo.deep_analysis.data.ryo_spot_price_usd} USD</div>
              <div>&bull; RYO 14-ATR: ${receipt.evidence.ryo.deep_analysis.data.atr_14_usd} USD</div>
              <div>&bull; Venue Basis: {receipt.evidence.venues.cross_venue_basis_bps} bps (CB/BN)</div>
              <div>&bull; RYO Safety: {receipt.evidence.ryo.check_safety.data.audit_verdict}</div>
              <div>&bull; GLEIF LEI: {receipt.evidence.legal_registries.gleif_lei} ({receipt.evidence.legal_registries.gleif_status})</div>
              <div>&bull; SEC EDGAR 8-K: {receipt.evidence.legal_registries.sec_edgar_8k_item}</div>
              <div>&bull; Sepolia Finalized Block: #{f.finalized_block_number}</div>
              <div>&bull; NY UCC § 12-105 Exclusive: {String(f.has_exclusive_control_12_105)}</div>
              <div>&bull; NY UCC § 12-102(a)(3) Value: ${f.disbursed_value_usd_12_102_a_3.toLocaleString()}</div>
              <div>&bull; NY UCC § 8-103(i) Non-Art8: {String(f.is_excluded_from_article_8_103_i)}</div>
              <div>&bull; NY UCC § 12-106 Single-Payee: {String(f.is_valid_12_106_single_payee_notice)}</div>
            </div>
          </div>
        </section>

        {/* CENTER PANEL: 3-AGENT COUNCIL (WITH JSON READBACK) & 8 SEQUENTIAL GATES */}
        <section
          style={{
            background: "#0F172A",
            border: "1px solid #1E293B",
            borderRadius: 8,
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 13, textTransform: "uppercase", color: "#93C5FD" }}>
            2. Autonomous 3-Agent Council (Programmatic JSON Number Readback)
          </h2>

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
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
                  <strong style={{ color: "#38BDF8" }}>{op.agent_title}</strong>
                  <span style={{ fontFamily: "monospace", color: "#94A3B8" }}>
                    Brier: {op.brier_score_7d} | Wt: {op.calibration_weight}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "#E2E8F0", margin: "8px 0" }}>{op.thesis}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {op.citations.map((c) => (
                    <div
                      key={c.json_path}
                      style={{
                        fontSize: 10.5,
                        fontFamily: "monospace",
                        background: "#064E3B",
                        color: "#A7F3D0",
                        padding: "3px 6px",
                        borderRadius: 4,
                      }}
                    >
                      [READBACK VERIFIED] {c.json_path} = {String(c.readback_value)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CALIBRATED JUDGE RULING */}
          <div
            style={{
              background: "#172554",
              border: "1px solid #1D4ED8",
              borderRadius: 6,
              padding: 10,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 12.5, color: "#93C5FD" }}>
              Calibrated Judge Agent Ruling &mdash; Stance: {receipt.judge_ruling.ruling_stance} (Conviction:{" "}
              {receipt.judge_ruling.combined_conviction})
            </div>
            <div style={{ fontSize: 12, color: "#E2E8F0", marginTop: 6, fontFamily: "monospace" }}>
              {receipt.judge_ruling.cause_and_effect_summary}
            </div>
            <div style={{ fontSize: 11, color: "#CBD5E1", marginTop: 6 }}>
              <strong>Explicit Rejections:</strong> {receipt.judge_ruling.explicit_rejections.join(" | ")}
            </div>
          </div>

          {/* 8 SEQUENTIAL DETERMINISTIC GATES */}
          <h2 style={{ margin: "4px 0 0 0", fontSize: 13, textTransform: "uppercase", color: "#93C5FD" }}>
            3. 8 Sequential Statutory &amp; Market Risk Gates (Fail-Closed Pipeline)
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {receipt.gate_verdicts.map((g) => (
              <div
                key={g.gate_number}
                style={{
                  background: "#0B0F17",
                  border: "1px solid #1E293B",
                  borderLeft:
                    g.status === "PASS"
                      ? "4px solid #10B981"
                      : g.status === "WARN_ROUTE"
                      ? "4px solid #F59E0B"
                      : "4px solid #EF4444",
                  borderRadius: 5,
                  padding: "7px 10px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>
                    G{g.gate_number}: {g.gate_name}{" "}
                    <span style={{ fontSize: 11, fontWeight: 400, color: "#94A3B8" }}>
                      ({g.statutory_or_market_authority})
                    </span>
                  </div>
                  <div style={{ fontSize: 11, fontFamily: "monospace", color: "#CBD5E1", marginTop: 2 }}>
                    {g.observed_value_summary}
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: "3px 7px",
                    borderRadius: 4,
                    background: g.status === "PASS" ? "#064E3B" : "#78350F",
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

        {/* RIGHT PANEL: PRACTICE LEDGER, SEPOLIA CRE ANCHOR & FRE 902(13)/(14) COURT PDF */}
        <section
          style={{
            background: "#0F172A",
            border: "1px solid #1E293B",
            borderRadius: 8,
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 13, textTransform: "uppercase", color: "#93C5FD" }}>
            4. Statutory Priority &amp; Virtual Practice Ledger
          </h2>

          <div
            style={{
              background: "#0B0F17",
              border: "1px solid #1E293B",
              borderRadius: 6,
              padding: 12,
              fontFamily: "monospace",
              fontSize: 12,
              lineHeight: 1.7,
            }}
          >
            <div>
              NY UCC § 12-105 Exclusive:{" "}
              <strong style={{ color: receipt.ucc12_exclusive_control ? "#34D399" : "#F87171" }}>
                {String(receipt.ucc12_exclusive_control)}
              </strong>
            </div>
            <div>
              NY UCC § 9-326A Super-Priority:{" "}
              <strong style={{ color: receipt.ucc9_326a_super_priority ? "#34D399" : "#F87171" }}>
                {String(receipt.ucc9_326a_super_priority)}
              </strong>
            </div>
            <div>
              NY UCC § 12-106 Discharge Lock:{" "}
              <strong style={{ color: receipt.section_12_106_discharge_blocked ? "#34D399" : "#FBBF24" }}>
                {String(receipt.section_12_106_discharge_blocked)}
              </strong>
            </div>
            <div>Statutory Action Code: #{receipt.practice_trade.statutory_action_code}</div>
            <div style={{ color: "#93C5FD", fontWeight: 700 }}>{receipt.practice_trade.action_label}</div>
            <hr style={{ borderColor: "#1E293B", margin: "8px 0" }} />
            <div>Virtual Balance: ${receipt.practice_trade.virtual_portfolio_balance_usd.toLocaleString()}</div>
            <div>Practice Direction: {receipt.practice_trade.direction}</div>
            <div>
              Allocated Notional: ${receipt.practice_trade.allocated_notional_usd.toLocaleString()} (
              {receipt.practice_trade.allocation_pct}%)
            </div>
            <div>Entry Price: {receipt.practice_trade.entry_price_usd ? `$${receipt.practice_trade.entry_price_usd}` : "N/A"}</div>
            <div>Stop (-1.5 ATR): {receipt.practice_trade.stop_loss_1_5_atr_usd ? `$${receipt.practice_trade.stop_loss_1_5_atr_usd}` : "N/A"}</div>
            <div>Target (+2R): {receipt.practice_trade.take_profit_2r_usd ? `$${receipt.practice_trade.take_profit_2r_usd}` : "N/A"}</div>
          </div>

          <div
            style={{
              background: "#0B0F17",
              border: "1px solid #1E293B",
              borderRadius: 6,
              padding: 12,
              fontFamily: "monospace",
              fontSize: 11,
              lineHeight: 1.6,
            }}
          >
            <div style={{ color: "#38BDF8", fontWeight: 700, marginBottom: 4 }}>
              Chainlink CRE Ethereum Sepolia Anchor
            </div>
            <div>KeystoneForwarder: {receipt.sepolia_anchor.key_forwarder_address.slice(0, 20)}...</div>
            <div>MockForwarder: {receipt.sepolia_anchor.mock_forwarder_address.slice(0, 20)}...</div>
            <div>IReceiver Contract: {receipt.sepolia_anchor.consumer_contract_address.slice(0, 20)}...</div>
            <div>Report ID (bytes2): {receipt.sepolia_anchor.report_id_bytes2}</div>
            <div>Sepolia TxHash: {receipt.sepolia_anchor.tx_hash.slice(0, 22)}...</div>
          </div>

          <button
            onClick={handleDownloadCourtPdf}
            style={{
              background: "#2563EB",
              color: "#FFFFFF",
              border: "none",
              padding: "12px 14px",
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Download FRE 902(13)/(14) Court Pleading PDF + Verify Embedded Proof
          </button>

          {pdfVerifyResult && (
            <div
              style={{
                background: pdfVerifyResult.valid ? "#064E3B" : "#7F1D1D",
                color: "#FFFFFF",
                padding: 10,
                borderRadius: 6,
                fontSize: 11,
                fontFamily: "monospace",
              }}
            >
              <div>
                PDF EMBEDDED PROOF VERIFICATION:{" "}
                <strong>{pdfVerifyResult.valid ? "PASS (AUTHENTIC)" : "FAIL"}</strong>
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

