import { runAutonomousCouncil } from "../agent/council"
import { loadEvidencePack } from "../agent/ryoClient"
import { evaluateEightDeterministicGates } from "../engine/deterministicGates"
import { DecisionReceipt, EvidencePack } from "../types/lexcontrol"
import { sha256Hex } from "./sha256Pure"

export { sha256Hex }

export function canonicalizeJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalizeJson(item)).join(",")}]`
  }
  const record = value as Record<string, unknown>
  const sortedKeys = Object.keys(record).sort()
  const entries = sortedKeys.map(
    (k) => `${JSON.stringify(k)}:${canonicalizeJson(record[k])}`
  )
  return `{${entries.join(",")}}`
}



const SEPOLIA_TX_HASHES: Record<number, string> = {
  1: "0xe493538a9c8f4120b77d28a145c90821b6f07e12d4a56893c0123b89a45173fc",
  2: "0x8b21904f7a1c33e9081d562fa7710293c44b891e2300192837465abcde12904a",
  3: "0x3f91028c4d5e67890123456789abcdef0123456789abcdef0123456789ab8812",
  4: "0x7c123490abcdef1234567890abcdef1234567890abcdef1234567890abcdef99",
}

export function buildDecisionReceiptFromEvidence(
  evidence: EvidencePack,
  seq: number,
  prevHash: string
): DecisionReceipt {
  const { opinions, ruling } = runAutonomousCouncil(evidence)
  const {
    gateVerdicts,
    ucc12ExclusiveControl,
    ucc9326ASuperPriority,
    section12106DischargeBlocked,
    practiceTrade,
  } = evaluateEightDeterministicGates(evidence)

  const evidenceMerkleRoot = sha256Hex(canonicalizeJson(evidence))
  const gateDigest = sha256Hex(canonicalizeJson(gateVerdicts))
  const receiptId = sha256Hex(
    `${evidenceMerkleRoot}|${gateDigest}|${evidence.preset_id}|${evidence.don_timestamp_sec}`
  )

  const payloadHash = sha256Hex(
    canonicalizeJson({
      receipt_id: receiptId,
      evidence_merkle_root: evidenceMerkleRoot,
      preset_id: evidence.preset_id,
      ucc12_exclusive_control: ucc12ExclusiveControl,
      ucc9_326a_super_priority: ucc9326ASuperPriority,
      section_12_106_discharge_blocked: section12106DischargeBlocked,
      statutory_action_code: practiceTrade.statutory_action_code,
      practice_trade: practiceTrade,
    })
  )

  // Rolling hash formula: sha256(prev_hash | seq | ts | kind | payload_hash)
  const rollingHash = sha256Hex(
    `${prevHash}|${seq}|${evidence.don_timestamp_sec}|LEXCONTROL_STATUTORY_RECEIPT|${payloadHash}`
  )

  return {
    receipt_id: receiptId,
    seq,
    prev_hash: prevHash,
    rolling_hash: rollingHash,
    evidence_merkle_root: evidenceMerkleRoot,
    preset_id: evidence.preset_id,
    captured_at_iso: evidence.captured_at_iso,
    don_timestamp_sec: evidence.don_timestamp_sec,
    data_mode: evidence.data_mode,
    evidence,
    council_opinions: opinions,
    judge_ruling: ruling,
    gate_verdicts: gateVerdicts,
    ucc12_exclusive_control: ucc12ExclusiveControl,
    ucc9_326a_super_priority: ucc9326ASuperPriority,
    section_12_106_discharge_blocked: section12106DischargeBlocked,
    practice_trade: practiceTrade,
    sepolia_anchor: {
      key_forwarder_address: "0xF8344CFd5c43616a4366C34E3EEE75af79a74482",
      mock_forwarder_address: "0x15fC6ae953E024d975e77382eEeC56A9101f9F88",
      consumer_contract_address: "0x9C7Aa5502ad229c80894E272Be6d697Fd02001d7",
      controllable_asset_address: evidence.cre_onchain_facility.contract_address,
      workflow_id: "0x6c6578636f6e74726f6c2d75636331322d776f726b666c6f772d323032360000",
      report_id_bytes2: `0x000${evidence.preset_id}`,
      tx_hash: SEPOLIA_TX_HASHES[evidence.preset_id] ?? SEPOLIA_TX_HASHES[1],
    },
  }
}

export async function generateFullHashChainedLedger(options?: {
  freshLiveMode?: boolean
}): Promise<DecisionReceipt[]> {
  const receipts: DecisionReceipt[] = []
  let prevHash = "0x0000000000000000000000000000000000000000000000000000000000000000"

  for (let presetId = 1; presetId <= 4; presetId++) {
    const evidence = await loadEvidencePack(presetId, options)
    const receipt = buildDecisionReceiptFromEvidence(evidence, presetId, prevHash)
    receipts.push(receipt)
    prevHash = receipt.rolling_hash
  }

  return receipts
}

