// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/Vm.sol";
import "forge-std/console.sol";
import "../src/EarThereum.sol";

contract EarThereumTest is Test {
    EarThereum public et;

    function setUp() public {
        et = new EarThereum();
        bytes memory data = vm.readFileBinary("test/fixtures/test_sample.deflate");
        bytes4 id = "ABCD";
        et.uploadSample(id, data);
    }

    function testSampleRead() public {
        // EarThereum.Sample memory sample = et.samples(id);
        // console.log("sample.data.length: ", sample.data.length);

        bytes4 id = "ABCD";
        bytes memory sampleData = et.getSampleData(id);
        console.log("sampleData.length: ", sampleData.length);
    }
}
