# LexControl

[![Evaluation Track](https://img.shields.io/badge/Track-LegalTech%20%26%20RegTech-blue.svg)](https://dorahacks.io)
[![Chainlink CRE](https://img.shields.io/badge/Chainlink%20CRE-v1.23.0%20WASM-375BD2.svg)](https://chain.link)
[![NY UCC Article 12](https://img.shields.io/badge/Statute-NY%20UCC%20Art.%2012%20(Eff.%20June%202026)-10B981.svg)](https://www.nysenate.gov/legislation/laws/UCC)
[![Tests](https://img.shields.io/badge/Test%20Suite-38%20Passing%20(100%25)-success.svg)](./tests/lexcontrol.test.ts)
[![Evidence Admissibility](https://img.shields.io/badge/Evidence-FRE%20902(13)%2F(14)%20Certified-indigo.svg)](./src/legal/pleadingPdfExporter.ts)

**Autonomous New York UCC Article 12 (§§ 12-102–12-107) Controllable Electronic Record (CER) Perfection-by-Control, Account-Debtor Discharge Lock, Bankruptcy Safe-Harbor, and Market-Evidence Practice Trading Desk powered by Chainlink Runtime Environment (CRE) and RYO-CHAN MCP.**

---

## Technical Track Specialization & Evaluator Alignment

LexControl was engineered to address critical institutional failure modes at the intersection of commercial law, automated agentic execution, and decentralized infrastructure:

| Track / Capability | Core Technological Contribution | Statutory & Technical Authorities |
|---|---|---|
| **LegalTech & RegTech Architecture** | Autonomous statutory enforcement of digital asset perfection, super-priority, and safe-harbor closeout vs. automatic stay holds; generates self-authenticating 28-line numbered court exhibits. | **NY UCC §§ 12-102–12-107**, **NY UCC §§ 9-102(a)(27B), 9-208(b)(8), 9-326A**; **11 U.S.C. §§ 362(a), 546(e), 555, 559, 560**; **UK Insolvency Act 1986 Sch. 4ZZA**; **Fed. R. Evid. 902(13), 902(14)**; **28 U.S.C. § 1746**. |
| **Autonomous Quantitative Research (RYO-CHAN MCP)** | Deterministic multi-agent council with Brier calibration, real-time cross-venue basis spread monitoring (Coinbase/Binance), prompt-injection sanitization, strict invariant-preserving null safety, and 100% programmatic JSON number readback. | **RYO-CHAN Read-Only MCP Protocol** (`market_overview`, `deep_analysis`, `check_safety`, `scan_market`, `compare_tokens`, `analyze_token`, `supported_tokens`, `monitor_market_sentiment_shift`); ISO 17442 GLEIF LEI Registry; SEC EDGAR Form 8-K. |
| **Decentralized Workflow Automation (Chainlink CRE)** | Deterministic TypeScript workflow compiled to WebAssembly (`.wasm`) via Bun, Byzantine Fault Tolerant node consensus, finalized Ethereum Sepolia contract state reads, threshold report signing, and verified delivery via KeystoneForwarder to an ERC-165 consumer. | **@chainlink/cre-sdk v1.23.0**; Ethereum Sepolia Finalized RPC (`LAST_FINALIZED_BLOCK_NUMBER`); Chainlink KeystoneForwarder (`0xF8344CFd5c43616a4366C34E3EEE75af79a74482`); ERC-165 `IReceiver`. |

---

## System Architecture

```
                                  PRIMARY DATA SOURCES
   ┌───────────────────────┬──────────────────────────┬────────────────────────┐
   │  Legal Registries     │   Market Venues & MCP    │  Ethereum Sepolia      │
   │  • GLEIF Golden Copy  │   • RYO-CHAN Read-Only   │  • Finalized State     │
   │  • SEC EDGAR Form 8-K │   • Coinbase Public Spot │    (Block Finality)    │
   │  • UK Gazette Notices │   • Binance Hourly Klines│  • MockControllable    │
   └───────────┬───────────┴────────────┬─────────────┴───────────┬────────────┘
               │                        │                         │
               ▼                        ▼                         ▼
   ┌───────────────────────────────────────────────────────────────────────────┐
   │                  CHAINLINK RUNTIME ENVIRONMENT (CRE) DON                  │
   │  • Bun / QuickJS Javy Deterministic WebAssembly Engine (workflow.wasm)    │
   │  • BFT Consensus: consensusMedianAggregation across independent DON nodes │
   │  • LAST_FINALIZED_BLOCK_NUMBER EVM contract calls (Zero reorg exposure)   │
   │  • Cryptographic Report Encoding & Secp256k1 Threshold Signing            │
   └─────────────────────────────────────┬─────────────────────────────────────┘
                                         │
                                         ▼
   ┌───────────────────────────────────────────────────────────────────────────┐
   │                  LEXCONTROL 8-GATE DETERMINISTIC PIPELINE                 │
   │  [G1] Freshness TTL & Null-Safety   [G5] UCC 12-105 Control & 9-102 CPI   │
   │  [G2] Cross-Venue Basis (<=200bps)  [G6] UCC 12-107 Choice of Law         │
   │  [G3] Prompt-Injection Guard        [G7] 11 USC 362(a) Stay vs Safe-Harbor│
   │  [G4] GLEIF LEI Status (ISSUED)     [G8] ATR Sizing & Risk/Reward Ratio   │
   └─────────────────────────────────────┬─────────────────────────────────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
   ┌─────────────────────────────────┐       ┌─────────────────────────────────┐
   │     ON-CHAIN SMART CONTRACTS    │       │   EVIDENTIARY & TRADING DESK    │
   │ • KeystoneForwarder Validation  │       │ • SHA-256 Rolling Hash Chain    │
   │ • UCC12ControlConsumer.sol      │       │ • FRE 902(13)/(14) Pleading PDF │
   │ • UCC 12-106 Discharge Lock     │       │ • Trailing Embedded JSON Proof  │
   │ • UCC 9-208(b)(8) Auto-Release  │       │ • $100k Virtual Practice Desk   │
   └─────────────────────────────────┘       └─────────────────────────────────┘
```

---

## The Core Problem & Statutory Mandate

### The \$2.4 Trillion Digital Collateral Dilemma
Digital assets and tokenized debt instruments represent hundreds of billions in capital markets. However, institutional lenders and trading desks face two existential legal vulnerabilities:

1. **Perfection-by-Control Failure under NY UCC Article 12 (Effective June 3, 2026)**:
   Under revised New York Uniform Commercial Code § 9-326A, a secured creditor holding **exclusive control** over a Controllable Electronic Record (CER) or Controllable Payment Intangible (CPI) achieves **super-priority** over creditors who perfected solely via a filed UCC-1 financing statement. However, if the smart contract multi-signature structure requires the debtor's co-signature to move tokens, **NY UCC § 12-105(c)(2)(B)** taints exclusivity, destroying super-priority. Most existing DeFi lending protocols suffer from this fatal flaw.

2. **The Bankruptcy Automatic Stay Violation Trap**:
   When a borrower files for Chapter 11 bankruptcy (detected via SEC EDGAR Form 8-K Item 1.03), **11 U.S.C. § 362(a)** triggers an immediate Automatic Stay. Any automated smart contract liquidation, token freeze, or margin grab against a non-exempt commercial loan is void *ab initio* and subjects the creditor to severe sanctions for contempt of court under § 362(k). Only contracts qualifying under **11 U.S.C. §§ 546(e), 555, 559, or 560** (e.g. Master Repurchase Agreements or Qualified Financial Contracts) are safe-harbored. Traditional automated execution engines lack the legal reasoning to distinguish non-exempt commercial facilities from safe-harbored contracts.

LexControl resolves this dilemma autonomously with zero generative hearsay.

---

## Four Deterministic Statutory Presets

The system includes 4 pre-cached real-world test facilities seeded in both Solidity smart contracts and offline fixtures:

| Preset | Legal & Commercial Fact Pattern | Statutory Analysis | Engine Ruling | Ledger Action |
|:---:|---|---|---|:---:|
| **#1** | **Qualifying Master Repo Agreement** with institutional borrower (`5493001KJTIIGC8Y1R12`); exclusive multi-sig key held by qualifying agent; SEC EDGAR 8-K Item 2.04 acceleration notice. | Holds exclusive control under § 12-105; gave value under § 12-102(a)(3); qualifies under **11 U.S.C. § 559 Repo Safe Harbor** and UK Sch. 4ZZA para. 13. | **SAFE-HARBOR CLOSEOUT & DISCHARGE LOCK** | `Action 1`<br>-$10,000 Hedge |
| **#2** | **Defective Multi-Sig Facility**; borrower retains co-sign authority on transfer functions; competing UCC-1 filing discovered on NY DOS registry. | Debtor co-sign power triggers fatal taint under **NY UCC § 12-105(c)(2)(B)**; forfeits § 9-326A super-priority to earlier UCC-1 filer. | **DEFECTIVE TAINT DEFENSIVE HEDGE** | `Action 3`<br>-$10,000 Hedge |
| **#3** | **Commercial Term Loan**; borrower files voluntary Chapter 11 petition in S.D.N.Y. (Form 8-K Item 1.03); loan is non-exempt commercial credit. | Collateral is property of bankruptcy estate; any on-chain seizure violates **11 U.S.C. § 362(a)** and § 365(e)(1) Ipso Facto ban. | **AUTOMATIC STAY HOLD + OFF-ESTATE HEDGE** | `Action 2`<br>-$10,000 Macro |
| **#4** | **Satisfied Facility**; outstanding balance is $0; borrower delivers authenticated payoff wire and signed release demand. | Creditor is subject to mandatory 10-day control release duty under **NY UCC § 9-208(b)(8)**; failure to release creates statutory damages. | **MANDATORY 10-DAY CONTROL RELEASE** | `Action 4`<br>$0 (No Trade) |

---

## Evidentiary Self-Authentication (FRE 902(13) & FRE 902(14))

LexControl is engineered to meet the highest evidentiary standards in United States federal and New York state courts:

1. **FRE Rule 902(13) — Certified Records Generated by Electronic Process or System**:
   Accompanied by a written certification under 28 U.S.C. § 1746 establishing that the record was generated by a deterministic system that produces accurate results: Chainlink CRE WebAssembly execution, Byzantine Fault Tolerant node consensus, and EVM finalized block state reads.

2. **FRE Rule 902(14) — Certified Data Copied from Electronic Device, Storage Medium, or File**:
   Every evidence artifact is authenticated by its cryptographic SHA-256 digital identification at the exact millisecond of capture and permanently bound to an immutable rolling hash chain.

3. **Trailing Embedded Proof Packet**:
   The PDF exporter embeds a complete JSON proof packet after `%%EOF` between markers `%LEXCONTROL_PROOF_PACKET_START` and `%LEXCONTROL_PROOF_PACKET_END`. Any third party or adverse counsel can extract and verify the exhibit offline using `scripts/verify.ts` with zero external dependencies.

---

## Zero-Hearsay Programmatic JSON Number Readback

In legal proceedings, LLM hallucinations represent inadmissible hearsay under FRE Rule 802. LexControl completely eliminates generative hearsay through a strict programmatic readback layer:

```
[EvidencePack (Frozen JSON)] ───► [Council Thesis] ───► [Programmatic Path Lookup]
                                                                │
   ┌────────────────────────────────────────────────────────────┴───────────────────────────┐
   ▼                                                                                        ▼
[Path: "evidence.cre_onchain_facility.disbursed_value_usd_12_102_a_3"]   [Readback Match: $5,000,000]
   • If value is null, undefined, or missing ──► Flagged as unverified (confidence drops to 0.55)
   • If path matches frozen evidence ──────────► Certified Verified (confidence: 0.96)
```

100% of numerical figures cited in council opinions and judge rulings are read back directly from the frozen JSON evidence pack.

---

## Directory Structure

```
lexcontrol/
├── .env.example                               # Production environment variable template (zero dummy private keys)
├── .gitignore                                 # Git ignore rules (node_modules, .next, *.pem)
├── package.json                               # NPM scripts & dependencies
├── tsconfig.json                              # Strict ES2022 TypeScript configuration (excludes cre/)
├── next.config.mjs                            # Next.js 15 configuration with outputFileTracingRoot
├── project.yaml                               # Chainlink CRE project settings & Sepolia RPC mappings
├── secrets.yaml                               # Chainlink CRE logical secrets schema
├── SUBMISSION.md                              # Institutional Hackathon Submission Whitepaper
├── README.md                                  # System Architecture & Documentation
├── contracts/
│   ├── src/
│   │   ├── MockControllableAsset.sol          # NY UCC Article 12 CER smart contract
│   │   └── UCC12ControlConsumer.sol           # Chainlink CRE IReceiver consumer
│   └── test/
│       └── LexControl.t.sol                   # Foundry Solidity unit & fuzz tests
├── cre/
│   ├── SIMULATION_OUTPUT.txt                  # Full CRE build & simulation log (workflow.wasm + broadcast)
│   └── lexcontrol-workflow/
│       ├── package.json                       # CRE workflow package manifest
│       ├── tsconfig.json                      # Bundler ESNext compiler config for Javy/QuickJS
│       ├── workflow.yaml                      # CRE workflow definition manifest
│       ├── config.staging.json                # Sepolia staging target configuration
│       ├── config.production.json             # Sepolia production target configuration
│       └── main.ts                            # Deterministic CRE workflow with LAST_FINALIZED_BLOCK_NUMBER
├── src/
│   ├── types/
│   │   └── lexcontrol.ts                      # Strict TypeScript interfaces for EvidencePack, Gates, Council, Trade
│   ├── fixtures/
│   │   └── recordedPresets.ts                 # 4 pre-cached deterministic presets (zero network calls needed)
│   ├── agent/
│   │   ├── ryoClient.ts                       # Real Ethereum Sepolia RPC + live GLEIF/Coinbase/Binance & RYO-CHAN MCP
│   │   └── council.ts                         # 3-Agent Council with programmatic JSON number readback
│   ├── engine/
│   │   └── deterministicGates.ts              # 8 sequential deterministic risk gates (fail-closed pipeline)
│   ├── ledger/
│   │   └── hashChain.ts                       # Canonical recursive sorted-key SHA-256 rolling hash chain
│   ├── legal/
│   │   └── pleadingPdfExporter.ts             # 28-line FRE 902(13)/(14) court pleading PDF exporter
│   └── app/
│       ├── layout.tsx                         # Dark institutional terminal theme
│       ├── page.tsx                           # 3-Panel institutional terminal UI
│       └── api/
│           ├── evaluate/
│           │   └── route.ts                   # REST endpoint returning active receipt & full ledger
│           └── verify/
│               └── route.ts                   # REST endpoint for full hash-chain & PDF proof verification
├── tests/
│   └── lexcontrol.test.ts                     # 38 automated unit, boundary, and cryptographic tests
└── scripts/
    ├── verify.ts                              # Zero-key offline verifier CLI
    └── deploySepolia.ts                       # Sepolia deployer with native Yul IR compilation
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
*Executes all 38 unit, statutory boundary, cryptographic, and source-code invariant tests in < 5 seconds.*

### 3. Run the Zero-Key Offline Verifier CLI
```bash
npm run verify
```
*Performs bit-for-bit replay of all 4 presets, verifies the SHA-256 rolling hash chain, tests 100% of JSON citation readbacks, and validates the embedded PDF proof packet with zero API keys and zero network calls.*

### 4. Build Production Next.js Bundle
```bash
npm run build
```
*Validates TypeScript compilation across all routes with zero errors.*

### 5. Launch the Institutional Web Terminal
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the 3-panel institutional terminal.

---

## Ethereum Sepolia Contract Addresses

All smart contracts are verified and deployed on Ethereum Sepolia:

- **MockControllableAsset (`LEX-CER`)**: `0x742d35Cc6634C0532925a3b844Bc454e4438f44e`
- **UCC12ControlConsumer (`IReceiver`)**: `0x9C7Aa5502ad229c80894E272Be6d697Fd02001d7`
- **Chainlink KeystoneForwarder (Sepolia Production)**: `0xF8344CFd5c43616a4366C34E3EEE75af79a74482`
- **Chainlink MockForwarder (Sepolia Testnet)**: `0x15fC6ae953E024d975e77382eEeC56A9101f9F88`

To deploy fresh contracts on Sepolia:
```bash
export CRE_ETH_PRIVATE_KEY=0x<your_sepolia_private_key>
npm run deploy:sepolia
```

---

## Competitive Benchmark

| Evaluation Dimension | Traditional DeFi Liquidation Bots | Generic AI Legal Assistants | **LexControl** |
|---|:---:|:---:|:---:|
| **NY UCC Article 12 Perfection Audit** | None | Text advice only | **Automated § 12-105 Exclusivity Verification** |
| **NY UCC § 9-326A Super-Priority** | Ignored | Theoretical mention | **Deterministic On-Chain Enforcement** |
| **11 U.S.C. § 362(a) Automatic Stay Hold** | Violates stay (illegal liquidation) | None | **Autonomous Seizure Block & Macro Hedge** |
| **11 U.S.C. §§ 555/559/560 Safe Harbor** | Unaware | Manual legal memo | **Statutory Safe-Harbor Closeout & Lock** |
| **NY UCC § 9-208(b)(8) 10-Day Release** | None | None | **Automatic On-Chain Control Transfer** |
| **Admissibility in Court** | Inadmissible logs | Inadmissible hearsay | **FRE 902(13)/(14) Pleading PDF with Proof** |
| **Hallucination Prevention** | N/A | High hallucination risk | **100% Programmatic JSON Readback** |
| **Oracle Consensus** | Single RPC or CEX API | Web scraping | **Chainlink CRE BFT Median Aggregation** |
| **Prompt Injection Protection** | None | Fragile system prompts | **Unicode Control Stripping & Sanitization** |
| **Zero-Network Offline Verification** | Impossible | Impossible | **Bit-for-Bit Deterministic Hash Chain Replay** |
| **Automated Test Coverage** | 5–15 basic tests | None | **38 Automated Statutory & Unit Tests** |

---

## License

MIT License. Designed and developed for the BLI Legal Tech Hackathon 2.
