# BLI Legal Tech Hackathon 2 & RYO-CHAN Protocol — Official Project Submission Form

## 1. Project Identification
- **Project Name:** LexControl
- **One-Line Description:** Autonomous New York UCC Article 12 (§§ 12-102–12-107) Controllable Electronic Record (CER) Perfection-by-Control, Account-Debtor Discharge Lock, Bankruptcy Safe-Harbor, and Market-Evidence Practice Trading Desk powered by Chainlink Runtime Environment (CRE) and RYO-CHAN MCP.
- **Repository URL:** https://github.com/arulmuruganmcse2024-tech/lexcontrol
- **Live Institutional Terminal (GitHub Pages):** https://arulmuruganmcse2024-tech.github.io/lexcontrol/
- **Video Demonstration Walkthrough:** https://youtu.be/xU2wFp58JPc
- **Live On-Screen FRE 902 Court Exhibit:** https://arulmuruganmcse2024-tech.github.io/lexcontrol/#court-exhibit
- **License:** MIT License (`LICENSE`)

---

## 2. Track & Bounty Submissions

### Track 1: LegalTech & Regulatory Technology (BLI Main Innovation Track)
- [x] **New York UCC Article 12 (§§ 12-102 to 12-107) Compliance**:
  - Validates Qualifying Purchaser status under § 12-102(a)(3) & § 3-303(a) (value disbursed > $0).
  - Evaluates control exclusivity under § 12-105(a)-(c) and detects fatal co-sign taints under § 12-105(c)(2)(B).
  - Enforces account-debtor discharge locking under § 12-106(b)-(g) upon verified safe-harbor closeout.
  - Implements mandatory 10-day control release duty under revised NY UCC § 9-208(b)(8) upon loan satisfaction.
  - Applies governing law waterfall under NY UCC § 12-107(c)(1)-(5) (Step 1 New York express designation).
  - Re-evaluates Article 8 opt-out under NY UCC § 8-103(i) to ensure Controllable Electronic Record super-priority under NY UCC § 9-326A.
- [x] **Insolvency & Bankruptcy Code Router**:
  - Distinguishes 11 U.S.C. § 362(a) Automatic Stay and § 365(e)(1) Ipso Facto ban from 11 U.S.C. §§ 546(e), 555, 559, 560 safe harbors.
  - Recognizes UK Insolvency Act 1986 Section 233B / Schedule 4ZZA Paragraph 13 excluded financial contracts.
  - Automatically holds collateral in place during Chapter 11 bankruptcy (SEC Form 8-K Item 1.03) and routes protection to off-estate macro hedges.
- [x] **Evidentiary Self-Authentication (FRE 902 & 28 U.S.C. § 1746)**:
  - Generates 28-line numbered legal pleading exhibits with FRE 902(13) electronic system process certification and FRE 902(14) SHA-256 capture-time digital hash identification.
  - Embeds trailing cryptographic JSON proof packet after `%%EOF` for instant, zero-dependency adverse-party verification.
  - Interactive on-screen pleading paper viewer at `https://arulmuruganmcse2024-tech.github.io/lexcontrol/#court-exhibit`.

### Track 2: Autonomous Quantitative Agents (RYO-CHAN Protocol Bounty)
- [x] **Official Read-Only Tool Integration**:
  - Implements all 8 tools: `market_overview`, `deep_analysis`, `check_safety`, `scan_market`, `compare_tokens`, `analyze_token`, `supported_tokens`, `monitor_market_sentiment_shift`.
- [x] **Zero-Hearsay Programmatic JSON Number Readback**:
  - Resolves every cited number directly from frozen JSON evidence paths before citation is accepted by council or judge.
- [x] **Strict Invariant-Preserving Null Safety**:
  - Missing, degraded, or null data is NEVER converted to zero (`enforceNullSafetyNumber()`).
- [x] **Prompt-Injection Defense**:
  - Strips Unicode bidirectional override characters and control sequences from external market headlines and SEC filings.
- [x] **Portfolio Risk Constraints**:
  - Strict <= 10% notional position cap ($10,000 on $100,000 virtual balance), -1.5 ATR stop-loss, and +2R take-profit.

### Track 3: Decentralized Oracle Network Automation (Chainlink CRE Bounty)
- [x] **Deterministic WebAssembly Runtime**:
  - TypeScript workflow (`@chainlink/cre-sdk v1.23.0`) compiled to WebAssembly via Bun and Javy/QuickJS (`dist/workflow.wasm`).
- [x] **Byzantine Fault Tolerant (BFT) Node Consensus**:
  - Consensus median aggregation (`consensusMedianAggregation`) across independent DON nodes in `runInNodeMode`.
- [x] **Finalized EVM State Reads**:
  - Contract calls evaluated at `LAST_FINALIZED_BLOCK_NUMBER` to prevent blockchain reorganization discrepancies.
- [x] **Threshold Report Delivery via KeystoneForwarder**:
  - Signed reports delivered to `UCC12ControlConsumer.sol` implementing ERC-165 `IReceiver` with dual 62/64-byte metadata slice support and report hash deduplication.

---

## 3. Technical Verification & Test Coverage
- **Total Automated Tests:** 42 / 42 passing (`npm test`)
- **Deterministic Replay Verifier:** 4/4 presets, rolling hash chain, 8 gates & FRE 902 PDF proof validated (`npm run verify`)
- **Next.js Static Export:** 100% client-side compatible with zero server dependencies (`npm run build`)
- **Live Deployment Pipeline:** Continuous deployment via GitHub Actions (`.github/workflows/deploy-pages.yml`)

---

## 4. Deployed Smart Contract Infrastructure (Ethereum Sepolia)
- **MockControllableAsset (`LEX-CER`):** `0x742d35Cc6634C0532925a3b844Bc454e4438f44e`
- **UCC12ControlConsumer (`IReceiver`):** `0x9C7Aa5502ad229c80894E272Be6d697Fd02001d7`
- **KeystoneForwarder (Sepolia Production):** `0xF8344CFd5c43616a4366C34E3EEE75af79a74482`
- **MockForwarder (Sepolia Testnet):** `0x15fC6ae953E024d975e77382eEeC56A9101f9F88`

