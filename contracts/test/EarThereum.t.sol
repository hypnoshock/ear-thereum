// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/Vm.sol";
import "forge-std/console.sol";
import {EarThereum} from "src/EarThereum.sol";

contract EarThereumTest is Test {
    EarThereum public et;
    bytes4 uploadedSampleID;

    function setUp() public {
        et = new EarThereum();
        bytes memory data = vm.readFileBinary("test/fixtures/6af90e19.deflate");
        uploadedSampleID = bytes4(keccak256(abi.encodePacked(data)));
        et.uploadSample(uploadedSampleID, data);
    }

    function testSampleID() public {
        assertEq(uploadedSampleID, bytes4(0x6af90e19));
    }

    function testSampleRead() public {
        bytes memory sampleData = et.getSampleData(uploadedSampleID);

        assertGt(sampleData.length, 0);
    }

    function testGetExistingIDs() public {
        bytes4[] memory sampleIDs = new bytes4[](3);
        sampleIDs[0] = "DEAD";
        sampleIDs[1] = uploadedSampleID;
        sampleIDs[2] = "BEEF";

        bytes4[] memory existingIDs;
        uint8 smpCount;
        (existingIDs, smpCount) = et.getExistingSampleIDs(sampleIDs);

        assertEq(smpCount, 1);
    }

    function testMultipleUpload() public {
        bytes4[] memory sampleIDs = new bytes4[](3);
        sampleIDs[0] = 0x9e266b46;
        sampleIDs[1] = 0x88e4eeac;
        sampleIDs[2] = 0x903c39ce;

        bytes[] memory samples = new bytes[](3);
        samples[0] = vm.readFileBinary("test/fixtures/9e266b46.deflate");
        samples[1] = vm.readFileBinary("test/fixtures/88e4eeac.deflate");
        samples[2] = vm.readFileBinary("test/fixtures/903c39ce.deflate");

        et.uploadSamples(sampleIDs, samples);

        bytes4[] memory existingIDs;
        uint8 smpCount;
        (existingIDs, smpCount) = et.getExistingSampleIDs(sampleIDs);

        assertEq(smpCount, 3);
    }

    function testFetchSamples() public {
        bytes4[] memory sampleIDs = new bytes4[](3);
        sampleIDs[0] = 0x9e266b46;
        sampleIDs[1] = 0x88e4eeac;
        sampleIDs[2] = 0x903c39ce;

        bytes[] memory samples = new bytes[](3);
        samples[0] = vm.readFileBinary("test/fixtures/9e266b46.deflate");
        samples[1] = vm.readFileBinary("test/fixtures/88e4eeac.deflate");
        samples[2] = vm.readFileBinary("test/fixtures/903c39ce.deflate");

        et.uploadSamples(sampleIDs, samples);

        bytes[] memory fetchedSamples = et.getSampleDatas(sampleIDs);

        // If the hashed sample data matches the ID from earlier then we can trust the data is correct
        for (uint8 i = 0; i < 3; i++) {
            bytes memory sample = fetchedSamples[i];
            bytes4 sampleID = bytes4(keccak256(abi.encodePacked(sample)));
            assertEq(sampleIDs[i], sampleID);
        }
    }
}
