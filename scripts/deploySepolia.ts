import fs from "node:fs"
import path from "node:path"
import solc from "solc"
import { createPublicClient, createWalletClient, http } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { sepolia } from "viem/chains"

const KEYSTONE_FORWARDER_SEPOLIA = "0xF8344CFd5c43616a4366C34E3EEE75af79a74482"
const MOCK_FORWARDER_SEPOLIA = "0x15fC6ae953E024d975e77382eEeC56A9101f9F88"

function compileContracts() {
  const assetSource = fs.readFileSync(
    path.join(process.cwd(), "contracts/src/MockControllableAsset.sol"),
    "utf8"
  )
  const consumerSource = fs.readFileSync(
    path.join(process.cwd(), "contracts/src/UCC12ControlConsumer.sol"),
    "utf8"
  )

  const input = {
    language: "Solidity",
    sources: {
      "MockControllableAsset.sol": { content: assetSource },
      "UCC12ControlConsumer.sol": { content: consumerSource },
    },
    settings: {
      viaIR: true,
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode"],
        },
      },
    },
  }

  const output = JSON.parse(solc.compile(JSON.stringify(input)))

  if (output.errors) {
    const fatal = output.errors.filter((e: { severity: string }) => e.severity === "error")
    if (fatal.length > 0) {
      throw new Error(`Solidity compilation error: ${JSON.stringify(fatal, null, 2)}`)
    }
  }

  const assetContract = output.contracts["MockControllableAsset.sol"]["MockControllableAsset"]
  const consumerContract = output.contracts["UCC12ControlConsumer.sol"]["UCC12ControlConsumer"]

  return {
    MockControllableAsset: {
      abi: assetContract.abi,
      bytecode: `0x${assetContract.evm.bytecode.object}` as `0x${string}`,
    },
    UCC12ControlConsumer: {
      abi: consumerContract.abi,
      bytecode: `0x${consumerContract.evm.bytecode.object}` as `0x${string}`,
    },
  }
}

async function main() {
  console.log("================================================================================")
  console.log(" LEXCONTROL ETHEREUM SEPOLIA DEPLOYMENT & BROADCAST DESK")
  console.log("================================================================================")

  const rpcUrl = process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com"
  const rawKey = process.env.CRE_ETH_PRIVATE_KEY || process.env.PRIVATE_KEY

  if (!rawKey || rawKey === "0x0000000000000000000000000000000000000000000000000000000000000000") {
    console.log("INFO: No active private key provided in CRE_ETH_PRIVATE_KEY or PRIVATE_KEY.")
    console.log("To broadcast to Ethereum Sepolia:")
    console.log("  1. Export your testnet private key: set CRE_ETH_PRIVATE_KEY=0x<your_key>")
    console.log("  2. Run: npm run deploy:sepolia\n")
    console.log("Compiling contracts locally to verify zero build errors...")
    const compiled = compileContracts()
    console.log("MockControllableAsset compiled successfully. Bytecode size:", compiled.MockControllableAsset.bytecode.length / 2, "bytes")
    console.log("UCC12ControlConsumer compiled successfully. Bytecode size:", compiled.UCC12ControlConsumer.bytecode.length / 2, "bytes")
    console.log("\n[SUCCESS] Local contract compilation passed with zero errors.")
    return
  }

  const formattedKey = (rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`) as `0x${string}`
  const account = privateKeyToAccount(formattedKey)
  console.log(`Deployer Address: ${account.address}`)

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  })

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(rpcUrl),
  })

  const balance = await publicClient.getBalance({ address: account.address })
  console.log(`Sepolia Balance:  ${Number(balance) / 1e18} ETH`)

  if (balance === 0n) {
    throw new Error("Deployer balance is 0 ETH on Sepolia. Please fund via Sepolia faucet before broadcasting.")
  }

  console.log("\n[STEP 1/3] Compiling Solidity contracts...")
  const compiled = compileContracts()

  console.log("\n[STEP 2/3] Deploying MockControllableAsset...")
  const assetDeployTx = await walletClient.deployContract({
    abi: compiled.MockControllableAsset.abi,
    bytecode: compiled.MockControllableAsset.bytecode,
    args: [account.address, account.address],
  })
  console.log(`  Asset Deploy TxHash: ${assetDeployTx}`)
  const assetReceipt = await publicClient.waitForTransactionReceipt({ hash: assetDeployTx })
  const assetAddress = assetReceipt.contractAddress!
  console.log(`  MockControllableAsset deployed at: ${assetAddress}`)

  console.log("\n[STEP 3/3] Deploying UCC12ControlConsumer...")
  const consumerDeployTx = await walletClient.deployContract({
    abi: compiled.UCC12ControlConsumer.abi,
    bytecode: compiled.UCC12ControlConsumer.bytecode,
    args: [assetAddress, KEYSTONE_FORWARDER_SEPOLIA, MOCK_FORWARDER_SEPOLIA],
  })
  console.log(`  Consumer Deploy TxHash: ${consumerDeployTx}`)
  const consumerReceipt = await publicClient.waitForTransactionReceipt({ hash: consumerDeployTx })
  const consumerAddress = consumerReceipt.contractAddress!
  console.log(`  UCC12ControlConsumer deployed at: ${consumerAddress}`)

  console.log("\n[CONFIGURING] Setting Consumer on MockControllableAsset...")
  const setConsumerTx = await walletClient.writeContract({
    address: assetAddress,
    abi: compiled.MockControllableAsset.abi,
    functionName: "setConsumerContract",
    args: [consumerAddress],
  })
  await publicClient.waitForTransactionReceipt({ hash: setConsumerTx })
  console.log(`  Consumer registered: ${setConsumerTx}`)

  console.log("\n================================================================================")
  console.log(" SEPOLIA DEPLOYMENT COMPLETE!")
  console.log("================================================================================")
  console.log(`NEXT_PUBLIC_CONTROLLABLE_ASSET_ADDRESS=${assetAddress}`)
  console.log(`NEXT_PUBLIC_CONSUMER_CONTRACT_ADDRESS=${consumerAddress}`)
  console.log("================================================================================")
}

main().catch((err) => {
  console.error("Deployment failed:", err)
  process.exit(1)
})

