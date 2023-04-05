// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract EarThereum {
    enum BitRate {
        BIT8,
        BIT16
    }

    struct Sample {
        bytes data;
        uint8 header;
    }

    struct Header {
        BitRate bitRate;
    }

    mapping(bytes4 => Sample) public samples;

    uint256 public counter = 23;

    function uploadSample(bytes4 id, bytes calldata data) public {
        require(samples[id].data.length == 0, "EarThereum::UploadSample: Sample with ID already exists");

        samples[id].data = data;
    }

    function getSampleData(bytes4 id) public view returns (bytes memory) {
        return samples[id].data;
    }

    function incCounter() public {
        counter++;
    }

    function getCounter() public view returns (uint256) {
        return counter;
    }
}
