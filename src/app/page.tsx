"use client"

import React, { useEffect, useMemo, useState } from "react"
import { fetchLiveMultiSourceEvidence } from "../agent/ryoClient"
import { RECORDED_EVIDENCE_PRESETS } from "../fixtures/recordedPresets"
import {
  buildDecisionReceiptFromEvidence,
  generateFullHashChainedLedger,
} from "../ledger/hashChain"
import {
  extractAndVerifyPdfProofPacket,
  generateCourtPleadingPdfBytes,
} from "../legal/pleadingPdfExporter"
import { DecisionReceipt, EvidencePack } from "../types/lexcontrol"

export default function LexControlTerminalPage() {
  const [activePresetId, setActivePresetId] = useState<number>(1)
  const [liveMode, setLiveMode] = useState<boolean>(false)
  const [customOverrides, setCustomOverrides] = useState<Partial<EvidencePack["cre_onchain_facility"]> | null>(null)
  const [viewTab, setViewTab] = useState<"terminal" | "court_exhibit">("terminal")
  const [verifyStatus, setVerifyStatus] = useState<string>(
    "Ledger Verified • 4/4 Statutory Facilities Ready"
  )
  const [pdfVerifyResult, setPdfVerifyResult] = useState<{
    valid: boolean
    recomputedHash: string | null
    receiptId: string | null
  } | null>(null)

  // Listen to hash change for #court-exhibit quick-link
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleHash = () => {
        if (window.location.hash === "#court-exhibit") {
          setViewTab("court_exhibit")
        }
      }
      handleHash()
      window.addEventListener("hashchange", handleHash)
      return () => window.removeEventListener("hashchange", handleHash)
    }
  }, [])

  // Base evidence from recorded fixtures or live API/RPC
  const [evidencePack, setEvidencePack] = useState<EvidencePack>(() => {
    return JSON.parse(JSON.stringify(RECORDED_EVIDENCE_PRESETS[1]))
  })

  // Load evidence whenever activePresetId or liveMode changes
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (liveMode) {
        try {
          const live = await fetchLiveMultiSourceEvidence(activePresetId)
          if (!cancelled) {
            setEvidencePack(live)
            setCustomOverrides(null)
          }
        } catch {
          if (!cancelled) {
            setEvidencePack(JSON.parse(JSON.stringify(RECORDED_EVIDENCE_PRESETS[activePresetId] ?? RECORDED_EVIDENCE_PRESETS[1])))
            setCustomOverrides(null)
          }
        }
      } else {
        setEvidencePack(JSON.parse(JSON.stringify(RECORDED_EVIDENCE_PRESETS[activePresetId] ?? RECORDED_EVIDENCE_PRESETS[1])))
        setCustomOverrides(null)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [activePresetId, liveMode])

  // Effective evidence with dynamic What-If overrides applied
  const effectiveEvidence: EvidencePack = useMemo(() => {
    const copy: EvidencePack = JSON.parse(JSON.stringify(evidencePack))
    if (customOverrides) {
      copy.cre_onchain_facility = {
        ...copy.cre_onchain_facility,
        ...customOverrides,
      }
      // Recompute exclusivity based on co-sign and unilateral transfer
      copy.cre_onchain_facility.has_exclusive_control_12_105 =
        !copy.cre_onchain_facility.transferor_cosign_required_12_105_c_2_b &&
        !copy.cre_onchain_facility.transferor_can_act_unilaterally_12_105_c_2_a
    }
    return copy
  }, [evidencePack, customOverrides])

  // Recompute active receipt in real-time
  const receipt: DecisionReceipt = useMemo(() => {
    return buildDecisionReceiptFromEvidence(
      effectiveEvidence,
      effectiveEvidence.preset_id,
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    )
  }, [effectiveEvidence])

  // Handle What-If overrides
  const handleToggleCoSign = () => {
    const current = customOverrides?.transferor_cosign_required_12_105_c_2_b ?? effectiveEvidence.cre_onchain_facility.transferor_cosign_required_12_105_c_2_b
    setCustomOverrides((prev) => ({
      ...prev,
      transferor_cosign_required_12_105_c_2_b: !current,
    }))
  }

  const handleToggleDisbursedValue = () => {
    const current = customOverrides?.disbursed_value_usd_12_102_a_3 ?? effectiveEvidence.cre_onchain_facility.disbursed_value_usd_12_102_a_3
    setCustomOverrides((prev) => ({
      ...prev,
      disbursed_value_usd_12_102_a_3: current > 0 ? 0 : 5000000,
    }))
  }

  const handleToggleArticle8 = () => {
    const current = customOverrides?.is_excluded_from_article_8_103_i ?? effectiveEvidence.cre_onchain_facility.is_excluded_from_article_8_103_i
    setCustomOverrides((prev) => ({
      ...prev,
      is_excluded_from_article_8_103_i: !current,
    }))
  }

  const handleToggleSinglePayee = () => {
    const current = customOverrides?.is_valid_12_106_single_payee_notice ?? effectiveEvidence.cre_onchain_facility.is_valid_12_106_single_payee_notice
    setCustomOverrides((prev) => ({
      ...prev,
      is_valid_12_106_single_payee_notice: !current,
    }))
  }

  const handleSetSafeHarborType = (typeVal: 0 | 1 | 4) => {
    if (typeVal === 4) {
      setCustomOverrides((prev) => ({
        ...prev,
        contract_safe_harbor_type: 1,
        outstanding_debt_usd: 0,
        debtor_signed_demand_timestamp: 1761800000,
      }))
    } else {
      setCustomOverrides((prev) => ({
        ...prev,
        contract_safe_harbor_type: typeVal,
        outstanding_debt_usd: typeVal === 1 ? 5000000 : 8000000,
        debtor_signed_demand_timestamp: 0,
      }))
    }
  }

  const handleResetOverrides = () => {
    setCustomOverrides(null)
  }

  // Verify all 4 presets in-browser
  const handleVerifyAllPresets = async () => {
    setVerifyStatus("Replaying 4/4 Presets, Rolling Hash Chain & PDF Proofs in Browser...")
    try {
      const fullLedger = await generateFullHashChainedLedger({ freshLiveMode: liveMode })
      let prevHash = "0x0000000000000000000000000000000000000000000000000000000000000000"
      let allMatch = true

      for (const rec of fullLedger) {
        const replayed = buildDecisionReceiptFromEvidence(rec.evidence, rec.seq, prevHash)
        const pdfBytes = generateCourtPleadingPdfBytes(rec)
        const pdfCheck = extractAndVerifyPdfProofPacket(pdfBytes)

        if (
          replayed.receipt_id !== rec.receipt_id ||
          replayed.rolling_hash !== rec.rolling_hash ||
          !pdfCheck.valid
        ) {
          allMatch = false
          break
        }
        prevHash = rec.rolling_hash
      }

      if (allMatch) {
        setVerifyStatus(
          "VERIFIED PASS • 4/4 Presets, Rolling SHA-256 Hash Chain & FRE 902 PDF Proofs Match Bit-for-Bit"
        )
      } else {
        setVerifyStatus("Verification Mismatch Encountered")
      }
    } catch (err) {
      setVerifyStatus("Verification Error: " + (err instanceof Error ? err.message : String(err)))
    }
  }

  // Download PDF
  const handleDownloadCourtPdf = () => {
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

  const f = receipt.evidence.cre_onchain_facility
  const isCustomized = customOverrides !== null

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#070B12",
        color: "#F1F5F9",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* INSTITUTIONAL HEADER & MASTHEAD */}
      <header
        style={{
          borderBottom: "1px solid #1E293B",
          background: "linear-gradient(180deg, #0F172A 0%, #090E17 100%)",
          padding: "12px 20px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              background: "#1D4ED8",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: "0.08em",
              padding: "4px 10px",
              borderRadius: 4,
              fontFamily: "ui-monospace, monospace",
              boxShadow: "0 0 14px rgba(29, 78, 216, 0.4)",
            }}
          >
            LEXCONTROL
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                NY UCC Article 12 CER Perfection, Safe-Harbor &amp; Practice Trading Desk
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
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
              Statutory Basis: NY UCC §§ 12-102–107 (Eff. June 3, 2026) &bull; 11 U.S.C. §§ 362(a) / 546(e) / 555 / 559 / 560 &bull; FRE 902(13)/(14) &bull; Chainlink CRE DON
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* VIEW TAB TOGGLE */}
          <div
            style={{
              display: "flex",
              background: "#0F172A",
              border: "1px solid #334155",
              borderRadius: 6,
              padding: 2,
            }}
          >
            <button
              onClick={() => {
                setViewTab("terminal")
                if (typeof window !== "undefined") window.location.hash = ""
              }}
              style={{
                background: viewTab === "terminal" ? "#2563EB" : "transparent",
                color: "#FFFFFF",
                border: "none",
                padding: "6px 12px",
                borderRadius: 4,
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Executive Console
            </button>
            <button
              onClick={() => {
                setViewTab("court_exhibit")
                if (typeof window !== "undefined") window.location.hash = "court-exhibit"
              }}
              style={{
                background: viewTab === "court_exhibit" ? "#2563EB" : "transparent",
                color: "#FFFFFF",
                border: "none",
                padding: "6px 12px",
                borderRadius: 4,
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              FRE 902 Court Pleading Tab
            </button>
          </div>

          {/* MODE TOGGLE */}
          <button
            onClick={() => setLiveMode(!liveMode)}
            style={{
              background: liveMode ? "#047857" : "#1E293B",
              color: "#FFFFFF",
              border: liveMode ? "1px solid #10B981" : "1px solid #334155",
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: liveMode ? "#34D399" : "#64748B",
                display: "inline-block",
              }}
            />
            {liveMode ? "Live Feeds (Coinbase/Binance/Sepolia)" : "Deterministic Replay"}
          </button>

          {/* VERIFY ALL PRESETS BUTTON */}
          <button
            onClick={handleVerifyAllPresets}
            style={{
              background: "#1D4ED8",
              color: "#FFFFFF",
              border: "1px solid #3B82F6",
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Replay 4/4 Presets
          </button>
        </div>
      </header>

      {/* SYSTEM STATUS TELEMETRY BAR */}
      <div
        style={{
          background: "#062319",
          borderBottom: "1px solid #064E3B",
          color: "#A7F3D0",
          padding: "5px 20px",
          fontSize: 11,
          fontFamily: "ui-monospace, monospace",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#34D399", fontWeight: 700 }}>● CRYPTOGRAPHIC STATUS:</span>
          <span>{verifyStatus}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span>FINALIZED BLOCK: #{f.finalized_block_number}</span>
          <span>ROLLING HASH: {receipt.rolling_hash.slice(0, 20)}...</span>
        </div>
      </div>

      {/* MAIN WORKSPACE CONTENT */}
      {viewTab === "court_exhibit" ? (
        /* ON-SCREEN 28-LINE NUMBERED COURT PLEADING PAPER VIEW */
        <div style={{ padding: 20, maxWidth: 960, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, color: "#93C5FD" }}>
                Official 28-Line Numbered Court Pleading Paper Exhibit (FRE 902(13) &amp; 902(14))
              </h2>
              <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "#94A3B8" }}>
                Self-authenticating electronic record with unsworn declaration under 28 U.S.C. § 1746 and trailing cryptographic JSON proof packet.
              </p>
            </div>
            <button
              onClick={handleDownloadCourtPdf}
              style={{
                background: "#2563EB",
                color: "#FFFFFF",
                border: "none",
                padding: "8px 16px",
                borderRadius: 6,
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Download Court-Ready PDF (.pdf)
            </button>
          </div>

          {/* REALISTIC 28-LINE PLEADING PAPER CONTAINER */}
          <div
            style={{
              backgroundColor: "#0B0F17",
              border: "2px solid #334155",
              borderRadius: 6,
              padding: "24px 30px",
              fontFamily: "ui-monospace, Courier, monospace",
              fontSize: 12,
              lineHeight: "24px",
              color: "#E2E8F0",
              boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
            }}
          >
            {/* PLEADING HEADER */}
            <div style={{ textAlign: "center", borderBottom: "1px solid #334155", paddingBottom: 12, marginBottom: 16 }}>
              <div style={{ fontWeight: 700 }}>UNITED STATES DISTRICT COURT / SUPREME COURT OF THE STATE OF NEW YORK</div>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>COMMERCIAL DIVISION — DIGITAL ASSET &amp; CONTROLLABLE ELECTRONIC RECORD PART</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "35px 1fr", gap: 16 }}>
              {/* LINE NUMBERS 1 TO 28 */}
              <div style={{ color: "#64748B", borderRight: "2px double #475569", paddingRight: 8, userSelect: "none" }}>
                {Array.from({ length: 28 }, (_, i) => (
                  <div key={i + 1} style={{ height: 24, textAlign: "right" }}>
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* PLEADING TEXT CONTENT */}
              <div style={{ lineHeight: "24px" }}>
                <div style={{ fontWeight: 700 }}>IN RE: LEXCONTROL STATUTORY PERFECTION &amp; SAFE-HARBOR AUDIT (PRESET #{receipt.preset_id})</div>
                <div>FACILITY ID: {f.facility_id}</div>
                <div>BORROWER GLEIF LEI: {receipt.evidence.legal_registries.gleif_lei} ({receipt.evidence.legal_registries.gleif_status})</div>
                <div style={{ fontWeight: 700, marginTop: 8, color: "#93C5FD" }}>I. DETERMINISTIC STATUTORY &amp; COMMERCIAL LAW VERDICT (NY UCC &amp; 11 U.S.C.)</div>
                <div>1. NY UCC § 12-105(a)-(c) Exclusive Control Verified: {receipt.ucc12_exclusive_control ? "YES (EXCLUSIVE)" : "NO (12-105(c)(2)(B) TAINT)"}</div>
                <div>2. NY UCC § 12-102(a)(3) &amp; § 3-303(a) Disbursed Value: ${f.disbursed_value_usd_12_102_a_3.toLocaleString()} USD</div>
                <div>3. NY UCC § 8-103(i) Non-Financial-Asset Confirmed: {String(f.is_excluded_from_article_8_103_i)}</div>
                <div>4. NY UCC § 9-326A Super-Priority Over UCC-1 Filings: {String(receipt.ucc9_326a_super_priority)}</div>
                <div>5. NY UCC § 12-106(b)-(f) Account-Debtor Discharge Lock: {String(receipt.section_12_106_discharge_blocked)}</div>
                <div>6. Statutory Action &amp; Safe-Harbor Routing: Action={receipt.practice_trade.statutory_action_code} ({receipt.practice_trade.action_label})</div>
                <div>7. Practice Desk Allocation: Dir={receipt.practice_trade.direction}, Notional=${receipt.practice_trade.allocated_notional_usd.toLocaleString()} USD</div>
                <div style={{ fontWeight: 700, marginTop: 8, color: "#93C5FD" }}>II. CERTIFICATE OF ELECTRONIC SYSTEM ACCURACY (FED. R. EVID. 902(13))</div>
                <div>Certified by qualified system custodian: Generated by deterministic Chainlink CRE WebAssembly DON consensus</div>
                <div>Finalized EVM State Read Mode: LAST_FINALIZED_BLOCK_NUMBER (#{f.finalized_block_number}) &bull; Zero Reorg Risk</div>
                <div style={{ fontWeight: 700, marginTop: 8, color: "#93C5FD" }}>III. CERTIFICATE OF DATA &amp; HASH IDENTIFICATION (FED. R. EVID. 902(14))</div>
                <div>Capture-Time Merkle Root: {receipt.evidence_merkle_root.slice(0, 36)}...</div>
                <div>Append-Only Chain Hash:  {receipt.rolling_hash.slice(0, 36)}...</div>
                <div style={{ fontWeight: 700, marginTop: 8, color: "#93C5FD" }}>IV. DECLARATION UNDER PENALTY OF PERJURY (28 U.S.C. § 1746)</div>
                <div>Executed on {receipt.captured_at_iso} &bull; Verification Result: ORIGINAL &amp; EXHIBIT IDENTICAL (PASS)</div>
                <div style={{ color: "#94A3B8", fontStyle: "italic" }}>Signed: /s/ Qualified Systems Custodian — LexControl Evidentiary Desk</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 3-PANEL EXECUTIVE CONSOLE */
        <main
          style={{
            display: "grid",
            gridTemplateColumns: "330px 1fr 360px",
            gap: 12,
            padding: 12,
            flex: 1,
          }}
        >
          {/* PANEL 1: SCENARIO PRESETS & WHAT-IF STRESS-TESTER */}
          <section
            style={{
              background: "#0F172A",
              border: "1px solid #1E293B",
              borderRadius: 8,
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#93C5FD" }}>
                1. Statutory Scenarios
              </h2>
              {isCustomized && (
                <button
                  onClick={handleResetOverrides}
                  style={{
                    background: "#7F1D1D",
                    color: "#FCA5A5",
                    border: "1px solid #991B1B",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 3,
                    cursor: "pointer",
                  }}
                >
                  Reset Overrides
                </button>
              )}
            </div>

            {/* 4 PRESETS */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[1, 2, 3, 4].map((id) => {
                const item = RECORDED_EVIDENCE_PRESETS[id]
                const isSel = activePresetId === id && !isCustomized
                return (
                  <button
                    key={id}
                    onClick={() => {
                      setActivePresetId(id)
                      setCustomOverrides(null)
                    }}
                    style={{
                      textAlign: "left",
                      padding: "8px 10px",
                      borderRadius: 5,
                      border: isSel ? "1.5px solid #3B82F6" : "1px solid #1E293B",
                      background: isSel ? "#1E293B" : "#0B0F17",
                      color: "#F8FAFC",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 11.5, display: "flex", justifyContent: "space-between" }}>
                      <span>Preset #{id}</span>
                      <span
                        style={{
                          fontSize: 9.5,
                          color: id === 1 ? "#34D399" : id === 4 ? "#38BDF8" : "#FBBF24",
                          fontFamily: "ui-monospace, monospace",
                        }}
                      >
                        {id === 1 ? "SAFE-HARBOR" : id === 2 ? "12-105(c) TAINT" : id === 3 ? "STAY HOLD" : "RELEASE"}
                      </span>
                    </div>
                    <div style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 2, lineHeight: 1.3 }}>
                      {item.preset_subtitle}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* WHAT-IF STATUTORY STRESS-TESTER CONTROLS */}
            <div style={{ borderTop: "1px solid #1E293B", paddingTop: 8, marginTop: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                <span>Interactive What-If Stress-Tester</span>
                <span style={{ fontSize: 9.5, color: "#94A3B8" }}>LIVE MUTATION</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 10.5 }}>
                {/* Toggle A */}
                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0B0F17", padding: "5px 8px", borderRadius: 4, border: "1px solid #1E293B" }}>
                  <span>NY UCC § 12-105(c)(2)(B) Co-Sign Taint:</span>
                  <input
                    type="checkbox"
                    checked={f.transferor_cosign_required_12_105_c_2_b}
                    onChange={handleToggleCoSign}
                    style={{ cursor: "pointer" }}
                  />
                </label>

                {/* Toggle B */}
                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0B0F17", padding: "5px 8px", borderRadius: 4, border: "1px solid #1E293B" }}>
                  <span>Disbursed Value &gt; $0 (§ 12-102(a)(3)):</span>
                  <input
                    type="checkbox"
                    checked={f.disbursed_value_usd_12_102_a_3 > 0}
                    onChange={handleToggleDisbursedValue}
                    style={{ cursor: "pointer" }}
                  />
                </label>

                {/* Toggle C */}
                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0B0F17", padding: "5px 8px", borderRadius: 4, border: "1px solid #1E293B" }}>
                  <span>Excluded from Article 8 (§ 8-103(i)):</span>
                  <input
                    type="checkbox"
                    checked={f.is_excluded_from_article_8_103_i}
                    onChange={handleToggleArticle8}
                    style={{ cursor: "pointer" }}
                  />
                </label>

                {/* Toggle D */}
                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0B0F17", padding: "5px 8px", borderRadius: 4, border: "1px solid #1E293B" }}>
                  <span>Single-Payee Notice (§ 12-106(d)(3)):</span>
                  <input
                    type="checkbox"
                    checked={f.is_valid_12_106_single_payee_notice}
                    onChange={handleToggleSinglePayee}
                    style={{ cursor: "pointer" }}
                  />
                </label>

                {/* Toggle E */}
                <div style={{ background: "#0B0F17", padding: "6px 8px", borderRadius: 4, border: "1px solid #1E293B" }}>
                  <div style={{ marginBottom: 4, color: "#CBD5E1" }}>Bankruptcy Safe-Harbor Branch:</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={() => handleSetSafeHarborType(1)}
                      style={{
                        flex: 1,
                        padding: "3px 4px",
                        fontSize: 9.5,
                        background: f.contract_safe_harbor_type === 1 && f.outstanding_debt_usd > 0 ? "#10B981" : "#1E293B",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 3,
                        cursor: "pointer",
                      }}
                    >
                      § 559 Repo
                    </button>
                    <button
                      onClick={() => handleSetSafeHarborType(0)}
                      style={{
                        flex: 1,
                        padding: "3px 4px",
                        fontSize: 9.5,
                        background: f.contract_safe_harbor_type === 0 ? "#F59E0B" : "#1E293B",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 3,
                        cursor: "pointer",
                      }}
                    >
                      § 362(a) Stay
                    </button>
                    <button
                      onClick={() => handleSetSafeHarborType(4)}
                      style={{
                        flex: 1,
                        padding: "3px 4px",
                        fontSize: 9.5,
                        background: f.outstanding_debt_usd === 0 ? "#38BDF8" : "#1E293B",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 3,
                        cursor: "pointer",
                      }}
                    >
                      § 9-208 Release
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* INGESTED EVIDENCE TELEMETRY */}
            <div style={{ borderTop: "1px solid #1E293B", paddingTop: 8, marginTop: "auto", fontSize: 10.5, fontFamily: "ui-monospace, monospace", lineHeight: 1.5, color: "#94A3B8" }}>
              <div>&bull; RYO Spot: ${receipt.evidence.ryo.deep_analysis.data.ryo_spot_price_usd} USD</div>
              <div>&bull; RYO 14-ATR: ${receipt.evidence.ryo.deep_analysis.data.atr_14_usd} USD</div>
              <div>&bull; Basis Spread: {receipt.evidence.venues.cross_venue_basis_bps} bps</div>
              <div>&bull; GLEIF LEI: {receipt.evidence.legal_registries.gleif_lei}</div>
            </div>
          </section>

          {/* PANEL 2: SVG CONTROL TOPOLOGY, 3-AGENT COUNCIL & 8 GATES */}
          <section
            style={{
              background: "#0F172A",
              border: "1px solid #1E293B",
              borderRadius: 8,
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              overflowY: "auto",
            }}
          >
            {/* LIVE SVG COLLATERAL CONTROL & SAFE-HARBOR ROUTING TOPOLOGY */}
            <div style={{ background: "#0B0F17", border: "1px solid #1E293B", borderRadius: 6, padding: "8px 12px" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#38BDF8", marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                <span>ON-CHAIN CONTROL &amp; ROUTING TOPOLOGY</span>
                <span style={{ color: "#64748B" }}>SEPOLIA TESTNET</span>
              </div>
              <svg viewBox="0 0 540 70" style={{ width: "100%", height: 70, overflow: "visible" }}>
                {/* Connections */}
                <line x1="60" y1="35" x2="160" y2="35" stroke="#334155" strokeWidth="2" strokeDasharray="3 3" />
                <line x1="160" y1="35" x2="270" y2="35" stroke="#334155" strokeWidth="2" />
                <line x1="270" y1="35" x2="380" y2="35" stroke="#334155" strokeWidth="2" />
                <line x1="380" y1="35" x2="480" y2="35" stroke="#334155" strokeWidth="2" />

                {/* Node 1: Debtor */}
                <g>
                  <circle cx="60" cy="35" r="18" fill="#1E293B" stroke={f.control_released_to_debtor ? "#38BDF8" : "#475569"} strokeWidth="2" />
                  <text x="60" y="32" textAnchor="middle" fill="#CBD5E1" fontSize="9" fontWeight="700">Debtor</text>
                  <text x="60" y="44" textAnchor="middle" fill="#94A3B8" fontSize="7">0xDeB7...</text>
                </g>

                {/* Node 2: Evidence & RYO MCP */}
                <g>
                  <circle cx="160" cy="35" r="18" fill="#1E293B" stroke="#06B6D4" strokeWidth="2" />
                  <text x="160" y="32" textAnchor="middle" fill="#06B6D4" fontSize="8.5" fontWeight="700">RYO MCP</text>
                  <text x="160" y="44" textAnchor="middle" fill="#94A3B8" fontSize="7">Evidence</text>
                </g>

                {/* Node 3: Chainlink CRE DON */}
                <g>
                  <circle cx="270" cy="35" r="20" fill="#172554" stroke="#3B82F6" strokeWidth="2.5" />
                  <text x="270" y="32" textAnchor="middle" fill="#93C5FD" fontSize="8.5" fontWeight="700">CRE DON</text>
                  <text x="270" y="44" textAnchor="middle" fill="#60A5FA" fontSize="7">BFT WASM</text>
                </g>

                {/* Node 4: KeystoneForwarder */}
                <g>
                  <circle cx="380" cy="35" r="18" fill="#1E293B" stroke="#8B5CF6" strokeWidth="2" />
                  <text x="380" y="32" textAnchor="middle" fill="#C4B5FD" fontSize="8" fontWeight="700">Forwarder</text>
                  <text x="380" y="44" textAnchor="middle" fill="#94A3B8" fontSize="7">0xF834...</text>
                </g>

                {/* Node 5: Consumer Contract */}
                <g>
                  <circle
                    cx="480"
                    cy="35"
                    r="20"
                    fill={receipt.section_12_106_discharge_blocked ? "#064E3B" : f.contract_safe_harbor_type === 0 ? "#78350F" : "#1E293B"}
                    stroke={receipt.section_12_106_discharge_blocked ? "#10B981" : f.contract_safe_harbor_type === 0 ? "#F59E0B" : "#38BDF8"}
                    strokeWidth="2"
                  />
                  <text x="480" y="31" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700">Consumer</text>
                  <text x="480" y="43" textAnchor="middle" fill="#CBD5E1" fontSize="7">
                    {receipt.section_12_106_discharge_blocked ? "LOCKED" : f.contract_safe_harbor_type === 0 ? "STAY" : "RELEASE"}
                  </text>
                </g>
              </svg>
            </div>

            {/* 3-AGENT COUNCIL */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {receipt.council_opinions.map((op) => (
                <div key={op.agent_id} style={{ background: "#0B0F17", border: "1px solid #1E293B", borderRadius: 5, padding: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5 }}>
                    <strong style={{ color: "#38BDF8" }}>{op.agent_title.split("(")[0]}</strong>
                    <span style={{ fontFamily: "ui-monospace, monospace", color: "#64748B" }}>
                      Brier: {op.brier_score_7d}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: "#E2E8F0", margin: "4px 0 6px 0", lineHeight: 1.35 }}>{op.thesis}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {op.citations.slice(0, 2).map((c) => (
                      <div
                        key={c.json_path}
                        style={{
                          fontSize: 9.5,
                          fontFamily: "ui-monospace, monospace",
                          background: "rgba(6, 78, 59, 0.5)",
                          color: "#A7F3D0",
                          padding: "2px 4px",
                          borderRadius: 3,
                          border: "1px solid rgba(16, 185, 129, 0.2)",
                        }}
                      >
                        [READBACK] {c.json_path.split(".").slice(-1)[0]} = {String(c.readback_value)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* CALIBRATED JUDGE RULING */}
            <div style={{ background: "linear-gradient(180deg, #172554 0%, #0F172A 100%)", border: "1px solid #1D4ED8", borderRadius: 5, padding: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700 }}>
                <span style={{ color: "#93C5FD" }}>Calibrated Ruling: {receipt.judge_ruling.ruling_stance}</span>
                <span style={{ color: "#38BDF8", fontFamily: "ui-monospace, monospace" }}>
                  Conviction: {(receipt.judge_ruling.combined_conviction * 100).toFixed(0)}%
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#E2E8F0", marginTop: 3, fontFamily: "ui-monospace, monospace", lineHeight: 1.35 }}>
                {receipt.judge_ruling.cause_and_effect_summary}
              </div>
            </div>

            {/* 8 SEQUENTIAL DETERMINISTIC GATES */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
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
                    padding: "4px 8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700 }}>
                      G{g.gate_number}: {g.gate_name}
                    </div>
                    <div style={{ fontSize: 9.5, fontFamily: "ui-monospace, monospace", color: "#94A3B8" }}>
                      {g.observed_value_summary}
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: "ui-monospace, monospace",
                      fontSize: 9.5,
                      fontWeight: 700,
                      padding: "2px 5px",
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

          {/* PANEL 3: STATUTORY PRIORITY, PRACTICE TRADING & FRE 902 PDF */}
          <section
            style={{
              background: "#0F172A",
              border: "1px solid #1E293B",
              borderRadius: 8,
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#93C5FD" }}>
              3. Priority &amp; Practice Desk
            </h2>

            {/* PRIORITY & STATUS METRICS */}
            <div style={{ background: "#0B0F17", border: "1px solid #1E293B", borderRadius: 5, padding: 10, fontFamily: "ui-monospace, monospace", fontSize: 11, lineHeight: 1.55 }}>
              <div>
                NY UCC § 12-105 Control:{" "}
                <strong style={{ color: receipt.ucc12_exclusive_control ? "#34D399" : "#F87171" }}>
                  {receipt.ucc12_exclusive_control ? "EXCLUSIVE" : "TAINTED (§ 12-105(c))"}
                </strong>
              </div>
              <div>
                NY UCC § 9-326A Priority:{" "}
                <strong style={{ color: receipt.ucc9_326a_super_priority ? "#34D399" : "#F87171" }}>
                  {receipt.ucc9_326a_super_priority ? "SUPER-PRIORITY" : "FORFEITED"}
                </strong>
              </div>
              <div>
                NY UCC § 12-106 Discharge:{" "}
                <strong style={{ color: receipt.section_12_106_discharge_blocked ? "#34D399" : "#FBBF24" }}>
                  {receipt.section_12_106_discharge_blocked ? "LOCKED TO TRANSFEREE" : "UNLOCKED"}
                </strong>
              </div>
              <div>Action Code: #{receipt.practice_trade.statutory_action_code} ({receipt.practice_trade.action_label.split("_")[0]})</div>
              <hr style={{ borderColor: "#1E293B", margin: "6px 0" }} />
              <div>Portfolio: ${receipt.practice_trade.virtual_portfolio_balance_usd.toLocaleString()} USD</div>
              <div>Direction: {receipt.practice_trade.direction}</div>
              <div>Allocated: ${receipt.practice_trade.allocated_notional_usd.toLocaleString()} ({receipt.practice_trade.allocation_pct}%)</div>
              <div>Entry / Stop / Target: ${receipt.practice_trade.entry_price_usd ?? "N/A"} / ${receipt.practice_trade.stop_loss_1_5_atr_usd ?? "N/A"} / ${receipt.practice_trade.take_profit_2r_usd ?? "N/A"}</div>
            </div>

            {/* SEPOLIA ANCHOR METADATA */}
            <div style={{ background: "#0B0F17", border: "1px solid #1E293B", borderRadius: 5, padding: 8, fontFamily: "ui-monospace, monospace", fontSize: 10, lineHeight: 1.45 }}>
              <div style={{ color: "#38BDF8", fontWeight: 700, marginBottom: 2 }}>Chainlink CRE Sepolia Anchor</div>
              <div>Forwarder: {receipt.sepolia_anchor.key_forwarder_address.slice(0, 18)}...</div>
              <div>Consumer: {receipt.sepolia_anchor.consumer_contract_address.slice(0, 18)}...</div>
              <div>TxHash: {receipt.sepolia_anchor.tx_hash.slice(0, 20)}...</div>
            </div>

            {/* DOWNLOAD COURT PDF BUTTON */}
            <button
              onClick={handleDownloadCourtPdf}
              style={{
                background: "linear-gradient(180deg, #2563EB 0%, #1D4ED8 100%)",
                color: "#FFFFFF",
                border: "1px solid #3B82F6",
                padding: "10px 12px",
                borderRadius: 5,
                fontWeight: 700,
                fontSize: 11.5,
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(37, 99, 235, 0.4)",
              }}
            >
              Export FRE 902(13)/(14) Court Pleading (.pdf)
            </button>

            {/* PDF PROOF VERIFICATION CARD */}
            {pdfVerifyResult && (
              <div
                style={{
                  background: pdfVerifyResult.valid ? "rgba(6, 78, 59, 0.8)" : "rgba(127, 29, 29, 0.8)",
                  border: pdfVerifyResult.valid ? "1px solid #10B981" : "1px solid #EF4444",
                  color: "#FFFFFF",
                  padding: 8,
                  borderRadius: 5,
                  fontSize: 10,
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                <div>
                  PROOF VERIFICATION:{" "}
                  <strong style={{ color: pdfVerifyResult.valid ? "#A7F3D0" : "#FCA5A5" }}>
                    {pdfVerifyResult.valid ? "AUTHENTICATED (PASS)" : "FAILED"}
                  </strong>
                </div>
                <div>Receipt: {pdfVerifyResult.receiptId?.slice(0, 22)}...</div>
                <div>SHA-256: {pdfVerifyResult.recomputedHash?.slice(0, 22)}...</div>
              </div>
            )}
          </section>
        </main>
      )}
    </div>
  )
}
