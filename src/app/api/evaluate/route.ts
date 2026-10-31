import { NextRequest, NextResponse } from "next/server"
import { generateFullHashChainedLedger } from "../../../ledger/hashChain"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const presetParam = Number(searchParams.get("preset") || "1")
  const freshParam = searchParams.get("fresh") === "true"

  const ledger = await generateFullHashChainedLedger({ freshLiveMode: freshParam })
  const activeReceipt = ledger.find((r) => r.preset_id === presetParam) ?? ledger[0]

  return NextResponse.json({
    status: "OK",
    active_receipt: activeReceipt,
    ledger,
  })
}

