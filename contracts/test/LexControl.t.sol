// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MockControllableAsset} from "../src/MockControllableAsset.sol";
import {UCC12ControlConsumer, IReceiver, IERC165} from "../src/UCC12ControlConsumer.sol";

contract LexControlSolidityTest {
    MockControllableAsset public asset;
    UCC12ControlConsumer public consumer;

    address public constant KEYSTONE_FORWARDER = 0xF8344CFd5c43616a4366C34E3EEE75af79a74482;
    address public constant MOCK_FORWARDER = 0x15fC6ae953E024d975e77382eEeC56A9101f9F88;
    address public constant SECURED_LENDER = 0x1111111111111111111111111111111111111111;
    address public constant QUALIFYING_AGENT = 0x2222222222222222222222222222222222222222;

    function setUp() public {
        asset = new MockControllableAsset(SECURED_LENDER, QUALIFYING_AGENT);
        consumer = new UCC12ControlConsumer(address(asset), KEYSTONE_FORWARDER, MOCK_FORWARDER);
        asset.setConsumerContract(address(consumer));
    }

    function testERC165SupportsIReceiverAndIERC165() public view {
        require(consumer.supportsInterface(type(IReceiver).interfaceId), "Must support IReceiver");
        require(consumer.supportsInterface(type(IERC165).interfaceId), "Must support IERC165");
        require(!consumer.supportsInterface(0xffffffff), "Must reject invalid interfaceId");
    }

    function testPreset1ValidRepoSafeHarborAnd64ByteKeystoneMetadata() public {
        setUp();
        // Authorize this test contract as a forwarder to simulate KeystoneForwarder call
        consumer.setAuthorizedForwarder(address(this), true);

        // 64-byte production KeystoneForwarder metadata (32B workflowId + 10B name + 20B owner + 2B reportId)
        bytes memory metadata64 = abi.encodePacked(
            bytes32(uint256(1)),
            bytes10("lexcontrol"),
            address(this),
            bytes2(0x0001)
        );
        require(metadata64.length == 64, "Metadata must be 64 bytes");

        bytes memory report = abi.encode(
            keccak256("RECEIPT_1"),
            keccak256("EVIDENCE_1"),
            uint256(1),
            true,
            true,
            true,
            uint8(1), // Action 1 = SAFE_HARBOR_CLOSEOUT + 12-106 Lock
            int256(-1),
            uint256(10000),
            uint256(252000000000),
            uint256(1761832800)
        );

        consumer.onReport(metadata64, report);
        require(consumer.getReceiptCount() == 1, "Receipt count must be 1");

        MockControllableAsset.FacilityControlRecord memory rec = asset.getFacilityFullRecord(1);
        require(rec.accountDebtorDischargeLockedToTransferee == true, "UCC 12-106 discharge lock must be true");
    }

    function testPreset4UCC9208MandatoryControlReleaseWith62ByteMetadata() public {
        setUp();
        consumer.setAuthorizedForwarder(address(this), true);

        // 62-byte simulation metadata slice
        bytes memory metadata62 = abi.encodePacked(
            bytes32(uint256(4)),
            bytes10("lexcontrol"),
            address(this)
        );
        require(metadata62.length == 62, "Metadata must be 62 bytes");

        bytes memory report = abi.encode(
            keccak256("RECEIPT_4"),
            keccak256("EVIDENCE_4"),
            uint256(4),
            true,
            true,
            false,
            uint8(4), // Action 4 = RELEASE_CONTROL_9_208
            int256(0),
            uint256(0),
            uint256(255000000000),
            uint256(1761835500)
        );

        consumer.onReport(metadata62, report);
        MockControllableAsset.FacilityControlRecord memory rec = asset.getFacilityFullRecord(4);
        require(rec.controlReleasedToDebtor == true, "UCC 9-208 controlReleasedToDebtor must be true");
        require(rec.securedPartyInControl == rec.debtorTransferor, "Control must revert to debtor");
    }
}

