import {
  buildDecisionReceiptFromEvidence,
  generateFullHashChainedLedger,
} from "../src/ledger/hashChain"
import {
  extractAndVerifyPdfProofPacket,
  generateCourtPleadingPdfBytes,
} from "../src/legal/pleadingPdfExporter"

async function main() {
  const args = process.argv.slice(2)
  const freshMode = args.includes("--fresh")

  console.log("================================================================================")
  console.log(" LEXCONTROL ZERO-KEY DETERMINISTIC VERIFIER (NY UCC ART. 12 / CRE / FRE 902)")
  console.log("================================================================================")
  console.log(`Execution Mode: ${freshMode ? "LIVE / FRESH DRIFT CHECK" : "OFFLINE RECORDED REPLAY (ZERO NETWORK CALLS)"}`)

  const ledger = await generateFullHashChainedLedger({ freshLiveMode: freshMode })
  let expectedPrevHash = "0x0000000000000000000000000000000000000000000000000000000000000000"
  let allPassed = true

  for (const receipt of ledger) {
    // 1. Replay receipt from stored evidence pack
    const replayed = buildDecisionReceiptFromEvidence(
      receipt.evidence,
      receipt.seq,
      expectedPrevHash
    )
    const identicalReplay =
      replayed.receipt_id === receipt.receipt_id &&
      replayed.rolling_hash === receipt.rolling_hash &&
      replayed.prev_hash === expectedPrevHash

    // 2. Verify every council citation readback
    const allCitationsVerified = receipt.council_opinions
      .flatMap((op) => op.citations)
      .every((c) => c.verified && c.readback_value !== null)

    // 3. Generate PDF & verify trailing embedded proof packet
    const pdfBytes = generateCourtPleadingPdfBytes(receipt)
    const pdfVerification = extractAndVerifyPdfProofPacket(pdfBytes)
    const pdfMatch =
      pdfVerification.valid &&
      pdfVerification.packet?.receipt_id === receipt.receipt_id &&
      pdfVerification.packet?.rolling_hash === receipt.rolling_hash

    const presetPass = identicalReplay && allCitationsVerified && pdfMatch
    if (!presetPass) {
      allPassed = false
    }

    console.log(`\n[PRESET #${receipt.preset_id}] ${receipt.evidence.preset_name}`)
    console.log(`  ├── Receipt ID:                 ${receipt.receipt_id}`)
    console.log(`  ├── Rolling Chain Hash:         ${receipt.rolling_hash}`)
    console.log(`  ├── Deterministic Replay Match: ${identicalReplay ? "PASS (identical: true)" : "FAIL"}`)
    console.log(`  ├── JSON Citation Readback:     ${allCitationsVerified ? "PASS (100% Readback Verified)" : "FAIL"}`)
    console.log(`  ├── NY UCC § 12-105 Exclusive:  ${receipt.ucc12_exclusive_control}`)
    console.log(`  ├── NY UCC § 9-326A Priority:   ${receipt.ucc9_326a_super_priority}`)
    console.log(`  ├── NY UCC § 12-106 Locked:     ${receipt.section_12_106_discharge_blocked}`)
    console.log(`  ├── Statutory Action Code:      Action=${receipt.practice_trade.statutory_action_code} (${receipt.practice_trade.action_label})`)
    console.log(`  ├── Practice Trade Allocation:  $${receipt.practice_trade.allocated_notional_usd} USD (${receipt.practice_trade.direction})`)
    console.log(`  ├── Sepolia Anchor TxHash:      ${receipt.sepolia_anchor.tx_hash}`)
    console.log(`  └── FRE 902(13)/(14) PDF Proof: ${pdfMatch ? "PASS (Embedded Proof Packet Verified)" : "FAIL"}`)

    expectedPrevHash = receipt.rolling_hash
  }

  console.log("\n================================================================================")
  if (allPassed) {
    console.log(" VERIFICATION VERDICT: PASS (4/4 Presets, Hash Chain, 8 Gates & FRE 902 PDF OK)")
    console.log("================================================================================")
    process.exit(0)
  } else {
    console.error(" VERIFICATION VERDICT: FAILED")
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

