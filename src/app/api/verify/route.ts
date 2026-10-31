import { NextRequest, NextResponse } from "next/server"
import {
  buildDecisionReceiptFromEvidence,
  generateFullHashChainedLedger,
} from "../../../ledger/hashChain"
import {
  extractAndVerifyPdfProofPacket,
  generateCourtPleadingPdfBytes,
} from "../../../legal/pleadingPdfExporter"

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { fresh?: boolean }
    const ledger = await generateFullHashChainedLedger({ freshLiveMode: Boolean(body.fresh) })
    let prevHash = "0x0000000000000000000000000000000000000000000000000000000000000000"

    const results = ledger.map((receipt) => {
      const replayed = buildDecisionReceiptFromEvidence(receipt.evidence, receipt.seq, prevHash)
      const identical =
        replayed.receipt_id === receipt.receipt_id &&
        replayed.rolling_hash === receipt.rolling_hash
      const pdfBytes = generateCourtPleadingPdfBytes(receipt)
      const pdfCheck = extractAndVerifyPdfProofPacket(pdfBytes)
      prevHash = receipt.rolling_hash

      return {
        preset_id: receipt.preset_id,
        receipt_id: receipt.receipt_id,
        rolling_hash: receipt.rolling_hash,
        identical,
        pdf_proof_valid: pdfCheck.valid,
        recomputed_pdf_hash: pdfCheck.recomputedHash,
      }
    })

    return NextResponse.json({
      verified: results.every((r) => r.identical && r.pdf_proof_valid),
      total_presets_checked: results.length,
      results,
    })
  } catch (err) {
    return NextResponse.json(
      { verified: false, error: err instanceof Error ? err.message : "Verification error" },
      { status: 500 }
    )
  }
}

