// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

/// @title IReceiver — Standard Chainlink CRE Keystone Report Receiver Interface
interface IReceiver is IERC165 {
    function onReport(bytes calldata metadata, bytes calldata report) external;
}

/// @title IMockControllableAsset — Interface to execute statutory NY UCC §§ 12-106 & 9-208(b)(8) transitions
interface IMockControllableAsset {
    function enforceSafeHarborDischargeLockUnderUCC12106(
        uint256 presetId,
        bytes32 proofReceiptId,
        uint256 donTimestamp
    ) external;

    function releaseControlUnderUCC9208(
        uint256 presetId,
        bytes32 proofReceiptId,
        uint256 donTimestamp
    ) external;
}

/// @title UCC12ControlConsumer — Chainlink CRE Consumer Anchoring 11-Field Statutory & Practice Trade Receipts
contract UCC12ControlConsumer is IReceiver {
    // Sepolia Production KeystoneForwarder: 0xF8344CFd5c43616a4366C34E3EEE75af79a74482
    // Sepolia Simulation MockForwarder:     0x15fC6ae953E024d975e77382eEeC56A9101f9F88
    address public s_owner;
    IMockControllableAsset public s_controllableAsset;
    mapping(address => bool) public s_authorizedForwarders;
    mapping(bytes32 => bool) public s_processedReportHashes;

    // Exact 11-Field Statutory & Practice-Trade Receipt Struct
    struct ControlAndTradeReceipt {
        bytes32 receiptId;                  // Field 1
        bytes32 evidenceMerkleRoot;         // Field 2
        uint256 presetId;                   // Field 3
        bool ucc12105ExclusiveControl;      // Field 4
        bool ucc9326ASuperPriority;         // Field 5
        bool section12106DischargeBlocked;  // Field 6 (NY UCC § 12-106(b)-(f) account-debtor discharge lock)
        uint8 statutoryActionCode;          // Field 7 (1=SAFE_HARBOR_CLOSEOUT, 2=AUTOMATIC_STAY_HOLD_HEDGE, 3=DEFENSIVE_TAINT_HEDGE, 4=RELEASE_CONTROL_9_208)
        int256 practiceTradeDirection;      // Field 8 (1=LONG, -1=SHORT_HEDGE, 0=NO_TRADE)
        uint256 practicePositionSizeUsd;    // Field 9
        uint256 consensusSpotPriceUsdE8;    // Field 10
        uint256 donTimestamp;               // Field 11
    }

    mapping(bytes32 => ControlAndTradeReceipt) public s_receipts;
    bytes32[] public s_receiptHistory;

    error UnauthorizedOwner(address caller);
    error UnauthorizedForwarder(address caller);
    error InvalidMetadataLength(uint256 length);
    error DuplicateReport(bytes32 reportHash);

    event ForwarderStatusUpdated(address indexed forwarder, bool authorized);
    event AutomaticStayRespectedOffEstateHedgeTriggered(
        bytes32 indexed receiptId,
        uint256 indexed presetId,
        uint256 practicePositionSizeUsd
    );
    event StatutoryReceiptAnchored(
        bytes32 indexed receiptId,
        uint256 indexed presetId,
        uint8 statutoryActionCode,
        bool ucc9326ASuperPriority,
        bool section12106DischargeBlocked,
        bytes32 workflowId,
        bytes2 reportId,
        bytes32 reportHash
    );

    modifier onlyOwner() {
        if (msg.sender != s_owner) revert UnauthorizedOwner(msg.sender);
        _;
    }

    constructor(
        address controllableAsset,
        address keystoneForwarder,
        address mockForwarder
    ) {
        s_owner = msg.sender;
        s_controllableAsset = IMockControllableAsset(controllableAsset);
        if (keystoneForwarder != address(0)) {
            s_authorizedForwarders[keystoneForwarder] = true;
            emit ForwarderStatusUpdated(keystoneForwarder, true);
        }
        if (mockForwarder != address(0)) {
            s_authorizedForwarders[mockForwarder] = true;
            emit ForwarderStatusUpdated(mockForwarder, true);
        }
    }

    function setAuthorizedForwarder(address forwarder, bool authorized) external onlyOwner {
        s_authorizedForwarders[forwarder] = authorized;
        emit ForwarderStatusUpdated(forwarder, authorized);
    }

    /// @notice Mandatory ERC-165 check invoked by KeystoneForwarder before calling onReport()
    function supportsInterface(bytes4 interfaceId) public pure override returns (bool) {
        return interfaceId == type(IReceiver).interfaceId || interfaceId == type(IERC165).interfaceId;
    }

    /// @notice Receives verified DON reports from Chainlink KeystoneForwarder / MockForwarder
    /// @dev Accepts both 62-byte (logical) and 64-byte (production KeystoneForwarder with bytes2 reportId) slices
    function onReport(bytes calldata metadata, bytes calldata report) external override {
        if (!s_authorizedForwarders[msg.sender]) {
            revert UnauthorizedForwarder(msg.sender);
        }
        if (metadata.length != 62 && metadata.length != 64) {
            revert InvalidMetadataLength(metadata.length);
        }

        // Safely slice tightly packed metadata (32 + 10 + 20 = 62 bytes, plus optional 2-byte reportId)
        bytes32 workflowId = bytes32(metadata[0:32]);
        bytes10 workflowName = bytes10(metadata[32:42]);
        address workflowOwner = address(bytes20(metadata[42:62]));
        bytes2 reportId = metadata.length == 64 ? bytes2(metadata[62:64]) : bytes2(0);
        (workflowName, workflowOwner);

        bytes32 reportHash = keccak256(report);
        if (s_processedReportHashes[reportHash]) {
            revert DuplicateReport(reportHash);
        }
        s_processedReportHashes[reportHash] = true;

        (
            bytes32 receiptId,
            bytes32 evidenceMerkleRoot,
            uint256 presetId,
            bool ucc12105ExclusiveControl,
            bool ucc9326ASuperPriority,
            bool section12106DischargeBlocked,
            uint8 statutoryActionCode,
            int256 practiceTradeDirection,
            uint256 practicePositionSizeUsd,
            uint256 consensusSpotPriceUsdE8,
            uint256 donTimestamp
        ) = abi.decode(
                report,
                (bytes32, bytes32, uint256, bool, bool, bool, uint8, int256, uint256, uint256, uint256)
            );

        s_receipts[receiptId] = ControlAndTradeReceipt({
            receiptId: receiptId,
            evidenceMerkleRoot: evidenceMerkleRoot,
            presetId: presetId,
            ucc12105ExclusiveControl: ucc12105ExclusiveControl,
            ucc9326ASuperPriority: ucc9326ASuperPriority,
            section12106DischargeBlocked: section12106DischargeBlocked,
            statutoryActionCode: statutoryActionCode,
            practiceTradeDirection: practiceTradeDirection,
            practicePositionSizeUsd: practicePositionSizeUsd,
            consensusSpotPriceUsdE8: consensusSpotPriceUsdE8,
            donTimestamp: donTimestamp
        });
        s_receiptHistory.push(receiptId);

        if (address(s_controllableAsset) != address(0)) {
            if (statutoryActionCode == 1 && section12106DischargeBlocked) {
                s_controllableAsset.enforceSafeHarborDischargeLockUnderUCC12106(
                    presetId,
                    receiptId,
                    donTimestamp
                );
            } else if (statutoryActionCode == 4) {
                s_controllableAsset.releaseControlUnderUCC9208(
                    presetId,
                    receiptId,
                    donTimestamp
                );
            } else if (statutoryActionCode == 2) {
                emit AutomaticStayRespectedOffEstateHedgeTriggered(
                    receiptId,
                    presetId,
                    practicePositionSizeUsd
                );
            }
        }

        emit StatutoryReceiptAnchored(
            receiptId,
            presetId,
            statutoryActionCode,
            ucc9326ASuperPriority,
            section12106DischargeBlocked,
            workflowId,
            reportId,
            reportHash
        );
    }

    function getReceiptCount() external view returns (uint256) {
        return s_receiptHistory.length;
    }
}

