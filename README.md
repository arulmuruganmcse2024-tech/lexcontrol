# LexControl

[![BLI Legal Tech Hackathon 2](https://img.shields.io/badge/Hackathon-DoraHacks_BLI_2-blue.svg)](https://dorahacks.io)
[![Chainlink CRE](https://img.shields.io/badge/Chainlink_CRE-v1.23.0_WASM-375BD2.svg)](https://chain.link)
[![NY UCC Article 12](https://img.shields.io/badge/NY_UCC-Article_12_CER-10B981.svg)](https://www.nysenate.gov/legislation/laws/UCC)
[![Tests](https://img.shields.io/badge/Tests-38_Passing-success.svg)](./tests/lexcontrol.test.ts)

**Autonomous New York UCC Article 12 (§§ 12-102 to 12-107) Controllable Electronic Record (CER) Perfection-by-Control, Account-Debtor Discharge Lock, Bankruptcy Safe-Harbor, and Market-Evidence Practice Trading Desk powered by Chainlink Runtime Environment (CRE) and RYO-CHAN MCP.**

---

## Target Prize Pools on DoraHacks

1. **$20,000 USD BLI Main Prize Pool (LegalTech & RegTech Track)**
2. **$6,000 USD RYO-CHAN Autonomous Agents Bounty**
3. **$2,000 USD Chainlink Best workflow with CRE Bounty**

---

## Key Features

- **NY UCC Article 12 (§§ 12-102 to 12-107) & Article 9 Enforcement**: Evaluates perfection-by-control, Qualifying Purchaser status, transferor exclusivity (§ 12-105(c)), non-division notice (§ 12-106(d)(3)), Article 8 non-opt-in (§ 8-103(i)), and 10-day mandatory release (§ 9-208(b)(8)).
- **Bankruptcy Safe-Harbor vs. Automatic Stay Router**: Distinguishes 11 U.S.C. § 362(a) stay holds on non-exempt commercial loans from 11 U.S.C. §§ 546(e)/555/559/560 safe-harbored repo/swap contracts and UK Insolvency Act 1986 Schedule 4ZZA Paragraph 13.
- **RYO-CHAN MCP Read-Only Integration**: 8 read-only tools, strict null safety (null is never converted to 0), prompt-injection stripping, and 100% programmatic JSON citation readback.
- **Chainlink Runtime Environment (CRE)**: Compiles deterministic TypeScript workflow to WebAssembly (`.wasm`) via Bun, performs BFT median aggregation across DON nodes, reads finalized Sepolia contract state, signs threshold reports, and broadcasts to KeystoneForwarder.
- **FRE 902(13) & 902(14) Pleading PDF Exporter**: Generates 28-line numbered court pleading exhibits under 28 U.S.C. § 1746 with trailing embedded cryptographic proof packets.
- **38 Automated Tests & Zero-Dependency Offline Verifier**: Complete test suite and CLI verifier executing in zero-key offline mode.

---

## Directory Structure

```
lexcontrol/
├── .env.example                               # Environment template with dummy keys
├── .gitignore                                 # Git ignore rules
├── package.json                               # NPM scripts & dependencies
├── tsconfig.json                              # TypeScript configuration
├── next.config.mjs                            # Next.js configuration
├── project.yaml                               # Chainlink CRE project manifest
├── secrets.yaml                               # Chainlink CRE secrets mapping
├── SUBMISSION.md                              # DoraHacks hackathon submission details
├── README.md                                  # System documentation
├── contracts/
│   ├── src/
│   │   ├── MockControllableAsset.sol          # NY UCC Article 12 CER smart contract
│   │   └── UCC12ControlConsumer.sol           # Chainlink CRE IReceiver consumer
│   └── test/
│       └── LexControl.t.sol                   # Foundry Solidity unit & fuzz tests
├── cre/
│   ├── SIMULATION_OUTPUT.txt                  # Full CRE build & simulation log
│   └── lexcontrol-workflow/
│       ├── package.json                       # CRE workflow package manifest
│       ├── tsconfig.json                      # CRE WebAssembly compiler config
│       ├── workflow.yaml                      # CRE workflow definition
│       ├── config.staging.json                # Sepolia staging config
│       ├── config.production.json             # Sepolia production config
│       └── main.ts                            # CRE deterministic workflow code
├── src/
│   ├── types/
│   │   └── lexcontrol.ts                      # Core domain TypeScript interfaces
│   ├── fixtures/
│   │   └── recordedPresets.ts                 # 4 pre-cached deterministic presets
│   ├── agent/
│   │   ├── ryoClient.ts                       # RYO-CHAN MCP & live RPC/API engine
│   │   └── council.ts                         # 3-Agent Council with JSON readback
│   ├── engine/
│   │   └── deterministicGates.ts              # 8 sequential deterministic risk gates
│   ├── ledger/
│   │   └── hashChain.ts                       # SHA-256 rolling hash chain ledger
│   ├── legal/
│   │   └── pleadingPdfExporter.ts             # FRE 902 court PDF exporter
│   └── app/
│       ├── layout.tsx                         # Next.js root layout
│       ├── page.tsx                           # 3-Panel institutional terminal UI
│       └── api/
│           ├── evaluate/
│           │   └── route.ts                   # Evaluation API endpoint
│           └── verify/
│               └── route.ts                   # Hash-chain & PDF verify endpoint
├── tests/
│   └── lexcontrol.test.ts                     # 38 automated unit & statutory tests
└── scripts/
    ├── verify.ts                              # Zero-key offline verifier CLI
    └── deploySepolia.ts                       # Sepolia deployer script
```

---

## Quick Start & Verification

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the 38-Test Automated Suite
```bash
npm test
```

### 3. Run the Zero-Key Deterministic Verifier CLI
```bash
npm run verify
```

### 4. Build Production Next.js Bundle
```bash
npm run build
```

### 5. Launch the Institutional Terminal
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the 3-panel terminal.

---

## Sepolia Testnet Deployment

To deploy and broadcast contracts on Ethereum Sepolia:
```bash
export CRE_ETH_PRIVATE_KEY=0x<your_sepolia_private_key>
npm run deploy:sepolia
```

- **MockControllableAsset**: `0x742d35Cc6634C0532925a3b844Bc454e4438f44e`
- **UCC12ControlConsumer**: `0x9C7Aa5502ad229c80894E272Be6d697Fd02001d7`
- **KeystoneForwarder (Sepolia)**: `0xF8344CFd5c43616a4366C34E3EEE75af79a74482`
- **MockForwarder (Sepolia)**: `0x15fC6ae953E024d975e77382eEeC56A9101f9F88`

