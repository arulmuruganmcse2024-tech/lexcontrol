// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title MockControllableAsset — NY UCC Article 12 CER & Controllable Payment Intangible (CPI)
/// @notice Enforces NY UCC §§ 12-102, 12-104, 12-105, 12-106, 12-107, 8-103(i), 9-102(a)(27B), 9-208(b)(8), and 9-326A
contract MockControllableAsset {
    string public constant name = "LexControl Senior Secured Controllable Note";
    string public constant symbol = "LEX-CER";
    uint8 public constant decimals = 18;

    // Express Article 12 Governing Law Designation under NY UCC § 12-107(c)(1) (Effective June 3, 2026)
    string public constant UCC_ARTICLE_12_JURISDICTION = "State of New York";
    uint8 public constant UCC_12_107_WATERFALL_STEP = 1;

    address public s_owner;
    address public s_consumerContract;

    // Safe-Harbor Classification Enum:
    // 0 = Non-Exempt Commercial Loan (Subject to 11 U.S.C. § 362(a) Automatic Stay & § 365(e)(1) Ipso Facto Ban)
    // 1 = 11 U.S.C. § 559 Repurchase Agreement (Safe-Harbored under §§ 362(b)(7), 546(f), 559)
    // 2 = 11 U.S.C. § 560 Swap Agreement (Safe-Harbored under §§ 362(b)(17), 546(g), 560)
    // 3 = 11 U.S.C. § 555 Securities Contract (Safe-Harbored under §§ 362(b)(6), 546(e), 555)
    struct FacilityControlRecord {
        bytes32 facilityId;
        string borrowerLei;
        address debtorTransferor;
        address securedPartyInControl;
        address qualifyingAgent; // NY UCC § 12-105(e) control through acknowledging agent
        bool accountDebtorUndertakesToPayController; // NY UCC § 9-102(a)(27B) CPI undertaking
        bool article8FinancialAssetOptIn; // NY UCC § 8-103(i): false = governed by Article 12, not Article 8
        uint256 disbursedValueUsd; // NY UCC § 12-102(a)(3) & § 3-303(a): must be > 0 (not unperformed promise)
        bool transferorCoSignRequired; // NY UCC § 12-105(c)(2)(B): true destroys control exclusivity!
        bool transferorCanActUnilaterally; // NY UCC § 12-105(c)(2)(A): true destroys control exclusivity!
        bool paymentInstructionDividesPayment; // NY UCC § 12-106(d)(3) & (g): false = valid single-payee instruction
        bool accountDebtorDischargeLockedToTransferee; // NY UCC § 12-106(b)-(f): true = debtor cannot pay former controller
        uint8 contractSafeHarborType; // 0=Non-Exempt, 1=559 Repo, 2=560 Swap, 3=555 Securities Contract
        bool ukSchedule4ZZAExcludedFinancialContract; // UK Insolvency Act 1986 Sch. 4ZZA para. 13
        uint256 outstandingDebtUsd;
        uint256 debtorSignedDemandTimestamp; // NY UCC § 9-208(b)(8) 10-day release clock
        bool controlReleasedToDebtor;
    }

    mapping(uint256 => FacilityControlRecord) private s_facilities;

    error UnauthorizedCaller(address caller);

    event ConsumerContractUpdated(address indexed previousConsumer, address indexed newConsumer);
    event DischargeLockedUnderUCC12106(
        uint256 indexed presetId,
        address indexed transfereeInControl,
        bytes32 indexed proofReceiptId,
        uint256 timestamp
    );
    event ControlReleasedUnderUCC9208(
        uint256 indexed presetId,
        address indexed debtor,
        bytes32 indexed proofReceiptId,
        uint256 timestamp
    );

    modifier onlyOwner() {
        if (msg.sender != s_owner) revert UnauthorizedCaller(msg.sender);
        _;
    }

    constructor(address initialSecuredParty, address initialAgent) {
        s_owner = msg.sender;
        address debtor = address(0xdEB7000000000000000000000000000000000001);

        // Preset 1: Valid Exclusive Control (§ 12-105) + 11 U.S.C. § 559 Repo Safe Harbor + § 12-106 Valid Notice
        s_facilities[1] = FacilityControlRecord({
            facilityId: keccak256("FACILITY_1_VALID_REPO_SAFE_HARBOR"),
            borrowerLei: "5493001KJTIIGC8Y1R12",
            debtorTransferor: debtor,
            securedPartyInControl: initialSecuredParty,
            qualifyingAgent: initialAgent,
            accountDebtorUndertakesToPayController: true,
            article8FinancialAssetOptIn: false,
            disbursedValueUsd: 5_000_000,
            transferorCoSignRequired: false,
            transferorCanActUnilaterally: false,
            paymentInstructionDividesPayment: false,
            accountDebtorDischargeLockedToTransferee: false,
            contractSafeHarborType: 1, // 11 U.S.C. § 559 Repo
            ukSchedule4ZZAExcludedFinancialContract: true,
            outstandingDebtUsd: 5_000_000,
            debtorSignedDemandTimestamp: 0,
            controlReleasedToDebtor: false
        });

        // Preset 2: Defective Shared Control — Transferor Co-Sign Taint under NY UCC § 12-105(c)(2)(B)
        s_facilities[2] = FacilityControlRecord({
            facilityId: keccak256("FACILITY_2_DEFECTIVE_12_105C_TAINT"),
            borrowerLei: "5493001KJTIIGC8Y1R12",
            debtorTransferor: debtor,
            securedPartyInControl: initialSecuredParty,
            qualifyingAgent: initialAgent,
            accountDebtorUndertakesToPayController: true,
            article8FinancialAssetOptIn: false,
            disbursedValueUsd: 3_500_000,
            transferorCoSignRequired: true, // FATAL TAINT under NY UCC § 12-105(c)(2)(B)
            transferorCanActUnilaterally: false,
            paymentInstructionDividesPayment: false,
            accountDebtorDischargeLockedToTransferee: false,
            contractSafeHarborType: 0,
            ukSchedule4ZZAExcludedFinancialContract: false,
            outstandingDebtUsd: 3_500_000,
            debtorSignedDemandTimestamp: 0,
            controlReleasedToDebtor: false
        });

        // Preset 3: Non-Exempt Commercial Loan in Chapter 11 — 11 U.S.C. § 362(a) Automatic Stay Hold
        s_facilities[3] = FacilityControlRecord({
            facilityId: keccak256("FACILITY_3_CH11_AUTOMATIC_STAY_HOLD"),
            borrowerLei: "5493001KJTIIGC8Y1R12",
            debtorTransferor: debtor,
            securedPartyInControl: initialSecuredParty,
            qualifyingAgent: initialAgent,
            accountDebtorUndertakesToPayController: true,
            article8FinancialAssetOptIn: false,
            disbursedValueUsd: 8_000_000,
            transferorCoSignRequired: false,
            transferorCanActUnilaterally: false,
            paymentInstructionDividesPayment: false,
            accountDebtorDischargeLockedToTransferee: false,
            contractSafeHarborType: 0, // Non-Exempt Commercial Loan -> Must NOT freeze/seize on-chain!
            ukSchedule4ZZAExcludedFinancialContract: false,
            outstandingDebtUsd: 8_000_000,
            debtorSignedDemandTimestamp: 0,
            controlReleasedToDebtor: false
        });

        // Preset 4: Paid-Off Facility with Signed Debtor Demand — NY UCC § 9-208(b)(8) 10-Day Mandatory Release
        s_facilities[4] = FacilityControlRecord({
            facilityId: keccak256("FACILITY_4_UCC_9_208_RELEASE_DUTY"),
            borrowerLei: "5493001KJTIIGC8Y1R12",
            debtorTransferor: debtor,
            securedPartyInControl: initialSecuredParty,
            qualifyingAgent: initialAgent,
            accountDebtorUndertakesToPayController: true,
            article8FinancialAssetOptIn: false,
            disbursedValueUsd: 2_000_000,
            transferorCoSignRequired: false,
            transferorCanActUnilaterally: false,
            paymentInstructionDividesPayment: false,
            accountDebtorDischargeLockedToTransferee: false,
            contractSafeHarborType: 1,
            ukSchedule4ZZAExcludedFinancialContract: true,
            outstandingDebtUsd: 0, // Loan paid off in full
            debtorSignedDemandTimestamp: 1761800000, // Signed demand received
            controlReleasedToDebtor: false
        });
    }

    function setConsumerContract(address consumerContract) external onlyOwner {
        emit ConsumerContractUpdated(s_consumerContract, consumerContract);
        s_consumerContract = consumerContract;
    }

    /// @notice Enforces NY UCC § 12-106(b)-(f) account-debtor discharge lock upon verified safe-harbor closeout
    function enforceSafeHarborDischargeLockUnderUCC12106(
        uint256 presetId,
        bytes32 proofReceiptId,
        uint256 donTimestamp
    ) external {
        if (msg.sender != s_consumerContract && msg.sender != s_owner) {
            revert UnauthorizedCaller(msg.sender);
        }
        FacilityControlRecord storage rec = s_facilities[presetId];
        rec.accountDebtorDischargeLockedToTransferee = true;
        emit DischargeLockedUnderUCC12106(presetId, rec.securedPartyInControl, proofReceiptId, donTimestamp);
    }

    /// @notice Enforces NY UCC § 9-208(b)(8) 10-day mandatory control transfer back to debtor upon loan payoff
    function releaseControlUnderUCC9208(
        uint256 presetId,
        bytes32 proofReceiptId,
        uint256 donTimestamp
    ) external {
        if (msg.sender != s_consumerContract && msg.sender != s_owner) {
            revert UnauthorizedCaller(msg.sender);
        }
        FacilityControlRecord storage rec = s_facilities[presetId];
        rec.controlReleasedToDebtor = true;
        rec.securedPartyInControl = rec.debtorTransferor;
        emit ControlReleasedUnderUCC9208(presetId, rec.debtorTransferor, proofReceiptId, donTimestamp);
    }

    /// @notice Finalized view helper called by Chainlink CRE EVMClient.callContract()
    function getFacilityControlData(uint256 presetId)
        external
        view
        returns (
            bytes32 facilityId,
            bool isCpiUndertaking,
            bool isExcludedFromArticle8,
            uint256 disbursedValueUsd,
            bool hasExclusiveControlUnder12105,
            bool isValid12106SinglePayeeNotice,
            uint8 waterfallStep12107,
            uint8 contractSafeHarborType,
            uint256 outstandingDebtUsd,
            uint256 debtorSignedDemandTimestamp,
            bool controlReleasedToDebtor
        )
    {
        FacilityControlRecord memory rec = s_facilities[presetId];
        bool exclusive = !rec.transferorCoSignRequired && !rec.transferorCanActUnilaterally;
        bool valid12106Notice = rec.accountDebtorUndertakesToPayController && !rec.paymentInstructionDividesPayment;
        return (
            rec.facilityId,
            rec.accountDebtorUndertakesToPayController,
            !rec.article8FinancialAssetOptIn,
            rec.disbursedValueUsd,
            exclusive,
            valid12106Notice,
            UCC_12_107_WATERFALL_STEP,
            rec.contractSafeHarborType,
            rec.outstandingDebtUsd,
            rec.debtorSignedDemandTimestamp,
            rec.controlReleasedToDebtor
        );
    }

    function getFacilityFullRecord(uint256 presetId) external view returns (FacilityControlRecord memory) {
        return s_facilities[presetId];
    }
}

