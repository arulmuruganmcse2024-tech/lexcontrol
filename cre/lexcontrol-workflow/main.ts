import {
  CronCapability,
  EVMClient,
  HTTPClient,
  Runner,
  TxStatus,
  bytesToHex,
  consensusMedianAggregation,
  encodeCallMsg,
  getNetwork,
  handler,
  hexToBase64,
  json,
  LAST_FINALIZED_BLOCK_NUMBER,
  ok,
  type NodeRuntime,
  type Runtime,
} from "@chainlink/cre-sdk"
import {
  decodeFunctionResult,
  encodeAbiParameters,
  encodeFunctionData,
  keccak256,
  parseAbi,
  parseAbiParameters,
  toHex,
  zeroAddress,
} from "viem"
import { z } from "zod"

const configSchema = z.object({
  schedule: z.string(),
  chainSelectorName: z.string(),
  controllableAssetAddress: z.string(),
  consumerAddress: z.string(),
  priceApiUrl: z.string(),
  presetId: z.number(),
  gasLimit: z.string(),
})

type Config = z.infer<typeof configSchema>

type PriceTickerPayload = {
  price?: string | number
  ethereum?: { usd?: number }
  data?: { amount?: string }
}

const controllableAssetAbi = parseAbi([
  "function getFacilityControlData(uint256 presetId) external view returns (bytes32 facilityId, bool isCpiUndertaking, bool isExcludedFromArticle8, uint256 disbursedValueUsd, bool hasExclusiveControlUnder12105, bool isValid12106SinglePayeeNotice, uint8 waterfallStep12107, uint8 contractSafeHarborType, uint256 outstandingDebtUsd, uint256 debtorSignedDemandTimestamp, bool controlReleasedToDebtor)",
])

const fetchConsensusSpotPriceE8 = (nodeRuntime: NodeRuntime<Config>): bigint => {
  const httpClient = new HTTPClient()
  const resp = httpClient
    .sendRequest(nodeRuntime, {
      url: nodeRuntime.config.priceApiUrl,
      method: "GET",
    })
    .result()

  if (!ok(resp)) {
    throw new Error(`Upstream price API failed with HTTP status: ${resp.statusCode}`)
  }

  const payload = json(resp) as PriceTickerPayload
  const rawPrice = payload.price ?? payload.ethereum?.usd ?? payload.data?.amount
  const numericPrice = Number(rawPrice)

  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    throw new Error("Invalid or non-positive price payload from upstream API")
  }

  return BigInt(Math.round(numericPrice * 1e8))
}

const onCronTrigger = (runtime: Runtime<Config>): string => {
  runtime.log("LexControl CRE Workflow triggered: auditing NY UCC Article 12 Control, 12-106 Discharge & Safe Harbors")

  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: runtime.config.chainSelectorName,
  })
  if (!network) {
    throw new Error(`Unsupported network: ${runtime.config.chainSelectorName}`)
  }

  const selectorBigInt =
    typeof network.chainSelector === "bigint"
      ? network.chainSelector
      : network.chainSelector.selector
  const evmClient = new EVMClient(selectorBigInt)

  const consensusSpotPriceUsdE8 = runtime
    .runInNodeMode(fetchConsensusSpotPriceE8, consensusMedianAggregation<bigint>())()
    .result()

  const callData = encodeFunctionData({
    abi: controllableAssetAbi,
    functionName: "getFacilityControlData",
    args: [BigInt(runtime.config.presetId)],
  })

  const rawFacilityReply = evmClient
    .callContract(runtime, {
      call: encodeCallMsg({
        from: zeroAddress,
        to: runtime.config.controllableAssetAddress,
        data: callData,
      }),
      blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
    })
    .result()

  const decoded = decodeFunctionResult({
    abi: controllableAssetAbi,
    functionName: "getFacilityControlData",
    data: bytesToHex(rawFacilityReply.data),
  })

  const [
    facilityId,
    isCpiUndertaking,
    isExcludedFromArticle8,
    disbursedValueUsd,
    hasExclusiveControlUnder12105,
    isValid12106SinglePayeeNotice,
    waterfallStep12107,
    contractSafeHarborType,
    outstandingDebtUsd,
    debtorSignedDemandTimestamp,
  ] = decoded

  const ucc9326ASuperPriority =
    isCpiUndertaking &&
    isExcludedFromArticle8 &&
    disbursedValueUsd > 0n &&
    hasExclusiveControlUnder12105 &&
    isValid12106SinglePayeeNotice &&
    waterfallStep12107 >= 1 &&
    waterfallStep12107 <= 5

  let statutoryActionCode = 1
  let section12106DischargeBlocked = false
  let practiceTradeDirection = -1n
  let practicePositionSizeUsd = 10000n

  if (outstandingDebtUsd === 0n && debtorSignedDemandTimestamp > 0n) {
    statutoryActionCode = 4
    section12106DischargeBlocked = false
    practiceTradeDirection = 0n
    practicePositionSizeUsd = 0n
  } else if (!hasExclusiveControlUnder12105) {
    statutoryActionCode = 3
    section12106DischargeBlocked = false
    practiceTradeDirection = -1n
    practicePositionSizeUsd = 10000n
  } else if (contractSafeHarborType === 0) {
    statutoryActionCode = 2
    section12106DischargeBlocked = false
    practiceTradeDirection = -1n
    practicePositionSizeUsd = 10000n
  } else {
    statutoryActionCode = 1
    section12106DischargeBlocked = isValid12106SinglePayeeNotice
    practiceTradeDirection = -1n
    practicePositionSizeUsd = 10000n
  }

  const donTimestampSec = BigInt(Math.floor(runtime.now().getTime() / 1000))
  const evidenceMerkleRoot = keccak256(
    toHex(
      `${facilityId}|${ucc9326ASuperPriority}|${section12106DischargeBlocked}|${statutoryActionCode}|${consensusSpotPriceUsdE8.toString()}`
    )
  )
  const receiptId = keccak256(
    toHex(`${evidenceMerkleRoot}|${runtime.config.presetId}|${donTimestampSec.toString()}`)
  )

  const reportData = encodeAbiParameters(
    parseAbiParameters(
      "bytes32 receiptId, bytes32 evidenceMerkleRoot, uint256 presetId, bool ucc12105ExclusiveControl, bool ucc9326ASuperPriority, bool section12106DischargeBlocked, uint8 statutoryActionCode, int256 practiceTradeDirection, uint256 practicePositionSizeUsd, uint256 consensusSpotPriceUsdE8, uint256 donTimestamp"
    ),
    [
      receiptId,
      evidenceMerkleRoot,
      BigInt(runtime.config.presetId),
      hasExclusiveControlUnder12105,
      ucc9326ASuperPriority,
      section12106DischargeBlocked,
      statutoryActionCode,
      practiceTradeDirection,
      practicePositionSizeUsd,
      consensusSpotPriceUsdE8,
      donTimestampSec,
    ]
  )

  const signedReport = runtime
    .report({
      encodedPayload: hexToBase64(reportData),
      encoderName: "evm",
      signingAlgo: "ecdsa",
      hashingAlgo: "keccak256",
    })
    .result()

  const writeResult = evmClient
    .writeReport(runtime, {
      receiver: runtime.config.consumerAddress,
      report: signedReport,
      gasConfig: {
        gasLimit: runtime.config.gasLimit,
      },
    })
    .result()

  if (writeResult.txStatus === TxStatus.SUCCESS) {
    const txHash = bytesToHex(writeResult.txHash || new Uint8Array(32))
    runtime.log(`LexControl 11-Field Statutory Receipt anchored on Sepolia: ${txHash}`)
    return txHash
  }

  throw new Error(
    `CRE writeReport failed: status=${writeResult.txStatus}, error=${writeResult.errorMessage || "unknown"}`
  )
}

const initWorkflow = (config: Config) => {
  const cron = new CronCapability()
  return [handler(cron.trigger({ schedule: config.schedule }), onCronTrigger)]
}

export async function main() {
  const runner = await Runner.newRunner<Config>({ configSchema })
  await runner.run(initWorkflow)
}

