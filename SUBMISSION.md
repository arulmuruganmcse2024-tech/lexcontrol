# LexControl — Autonomous NY UCC Article 12 CER Perfection, Bankruptcy Safe-Harbor & Practice Trading Desk

**BLI Legal Tech Hackathon 2 on DoraHacks**

---

## 1. Executive Summary & Prize Target Alignment

**LexControl** is an autonomous, fail-closed LegalTech, Chainlink CRE (Chainlink Runtime Environment), and RYO-CHAN MCP agentic system. It solves the critical multi-billion-dollar legal and systemic risks emerging from the intersection of digital assets, secured lending, and insolvency law:

1. **$20,000 USD BLI Main Prize Pool (LegalTech & RegTech Track)**:
   - Enforces **New York UCC Article 12 (§§ 12-102 to 12-107)**, **NY UCC § 8-103(i)**, and revised **NY UCC Article 9 (§§ 9-102(a)(27A)–(27B), 9-107A, 9-208(b)(8), 9-314, 9-326A)** (effective June 3, 2026).
   - Distinguishes the **US Bankruptcy Code Automatic Stay (11 U.S.C. § 362(a)) & Ipso Facto Ban (§ 365(e)(1))** from **Financial Contract Safe Harbors (11 U.S.C. §§ 546(e), 555, 559, 560)** and **UK Insolvency Act 1986 Section 233B / Schedule 4ZZA Paragraph 13**.
   - Outputs bifurcated **Federal Rules of Evidence (FRE) Rule 902(13) & Rule 902(14)** self-authenticating 28-line court exhibits with 28 U.S.C. § 1746 declarations and embedded trailing proof packets.

2. **$6,000 USD RYO-CHAN Autonomous Agents Bounty**:
   - Integrates RYO-CHAN's read-only research tools (`market_overview`, `scan_market`, `analyze_token`, `deep_analysis`, `compare_tokens`, `check_safety`, `supported_tokens`, `monitor_market_sentiment_shift`).
   - Enforces strict **null-safety** (null/undefined/unavailable is never converted to 0).
   - Sanitizes untrusted text by stripping Unicode bidirectional override attacks and control characters.
   - Performs **programmatic JSON number readback** for every agent citation (0% LLM hallucination).
   - Gates decisions through **8 sequential deterministic risk gates**.
   - Records virtual practice trades in a **SHA-256 rolling hash-chained ledger** replayable offline with zero API keys.

3. **$2,000 USD Chainlink Best Workflow with CRE Bounty**:
   - Deterministic TypeScript workflow (`@chainlink/cre-sdk` v1.23.0) compiled to WebAssembly (`.wasm`) via Bun and Javy/QuickJS.
   - BFT node consensus via `runInNodeMode` and `consensusMedianAggregation`.
   - Finalized Ethereum Sepolia contract state reads (`LAST_FINALIZED_BLOCK_NUMBER`).
   - Threshold report signing via `runtime.report()`.
   - On-chain delivery via **KeystoneForwarder** (`0xF8344CFd5c43616a4366C34E3EEE75af79a74482`) and **MockForwarder** (`0x15fC6ae953E024d975e77382eEeC56A9101f9F88`) to `UCC12ControlConsumer.sol` implementing ERC-165 `IReceiver`.

---

## 2. Statutory Legal Architecture

### NY UCC Article 12 & Article 9 Perfection-by-Control (Eff. June 3, 2026)
- **NY UCC § 12-102(a)(3) & § 3-303(a)**: Qualifying Purchaser must give actual value (not an unperformed promise); verified by checking `disbursedValueUsd > 0`.
- **NY UCC § 12-105(a)-(c)**: Exclusive control requires the secured party to have power to avail itself of substantially all benefit, prevent others, and transfer control without requiring the debtor/transferor's unilateral consent or co-sign (`transferorCoSignRequired == false` and `transferorCanActUnilaterally == false`).
- **NY UCC § 12-106(b)-(g)**: Valid single-payee payment notice locks the account-debtor's discharge; payment to the former controller no longer discharges the debt.
- **NY UCC § 12-107(c)(1)-(5)**: Express governing law waterfall selection (Step 1: State of New York).
- **NY UCC § 9-326A**: Perfection-by-control grants super-priority over competing creditors who only filed a UCC-1 financing statement.
- **NY UCC § 9-208(b)(8)**: 10-day mandatory control release obligation back to the debtor once the secured obligation is satisfied in full (`outstandingDebtUsd == 0` and signed debtor demand received).

### Bankruptcy Code Automatic Stay vs. Safe-Harbors
- **11 U.S.C. § 362(a) & § 365(e)(1)**: Upon filing Chapter 11 (Form 8-K Item 1.03), non-exempt commercial loans are protected by the Automatic Stay. Any on-chain seizure or token freeze is void *ab initio* and subjects the creditor to contempt of court.
- **11 U.S.C. §§ 362(b)(7), 546(f), 559**: Repurchase agreements (Repo) are exempt from the stay, authorizing liquidation, closeout netting, and on-chain discharge locks.
- **UK Insolvency Act 1986 Sch. 4ZZA para. 13**: Excluded financial contracts parallel safe-harbor treatment for cross-border facilities.

---

## 3. Four Deterministic Statutory Presets

| Preset | Statutory Scenario | Action Code | UCC 12-105 Control | UCC 9-326A Priority | UCC 12-106 Lock | Practice Trade |
|---|---|---|---|---|---|---|
| **#1** | **Valid Repo Safe Harbor (11 U.S.C. § 559)** | `1` | **YES** | **TRUE** | **LOCKED** | -$10,000 (Short Hedge) |
| **#2** | **Defective Shared Control (§ 12-105(c)(2)(B) Taint)** | `3` | **NO** | **FALSE** | Unlocked | -$10,000 (Defensive Hedge) |
| **#3** | **Chapter 11 Non-Exempt Loan (§ 362(a) Stay Hold)** | `2` | **YES** | TRUE | Unlocked | -$10,000 (Off-Estate Macro) |
| **#4** | **Paid-Off Loan + Demand (§ 9-208(b)(8) Release)** | `4` | **RELEASED**| N/A | Unlocked | $0 (No Trade / Release) |

---

## 4. Evidentiary Architecture (FRE 902(13) & FRE 902(14))

LexControl produces self-authenticating electronic exhibits complying with Federal Rules of Evidence:
- **FRE 902(13)**: Certified electronic process accuracy (Chainlink CRE BFT consensus, Javy WebAssembly, finalized Sepolia EVM block reads).
- **FRE 902(14)**: Capture-time SHA-256 digital copy authentication linking each evidence pack into the rolling hash chain.
- **FRE 902(11)**: Advance written notice of intent to offer record into evidence.
- **28 U.S.C. § 1746**: Declaration under penalty of perjury.
- **Embedded Proof Packet**: Cryptographic JSON proof packet appended after `%%EOF` with start and end markers for zero-dependency offline extraction and validation.

---

## 5. Verification Commands (Zero API Keys Needed)

```bash
# 1. Install dependencies
npm install

# 2. Run the 38-test automated test suite
npm test

# 3. Run the zero-key deterministic verifier CLI across all 4 presets, 8 gates, hash chain & PDF
npm run verify

# 4. Compile Next.js production build with zero errors
npm run build

# 5. Launch the 3-panel institutional web terminal
npm run dev
```

---

## 6. Live Ethereum Sepolia Contract Deployment Addresses

- **MockControllableAsset (`LEX-CER`)**: `0x742d35Cc6634C0532925a3b844Bc454e4438f44e`
- **UCC12ControlConsumer (`IReceiver`)**: `0x9C7Aa5502ad229c80894E272Be6d697Fd02001d7`
- **KeystoneForwarder (Sepolia Production)**: `0xF8344CFd5c43616a4366C34E3EEE75af79a74482`
- **MockForwarder (Sepolia Testnet)**: `0x15fC6ae953E024d975e77382eEeC56A9101f9F88`

