// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

// type SampleID is bytes4; // -- This was more of a pain than it was worth. I had trouble converting from keccak to this

contract EarThereum {
    error SampleAlreadyExists(bytes4 id);
    error ArrayLengthsMustMatch();

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

    function uploadSample(bytes4 id, bytes calldata data) public {
        if (samples[id].data.length > 0) revert SampleAlreadyExists(id);

        samples[id].data = data;
    }

    function uploadSamples(bytes4[] calldata ids, bytes[] calldata sampleData) public {
        if (ids.length != sampleData.length) {
            revert ArrayLengthsMustMatch();
        }

        for (uint8 i = 0; i < ids.length; i++) {
            if (samples[ids[i]].data.length == 0) {
                samples[ids[i]].data = sampleData[i];
            }
            // - No need to actually revert here, if anything probably annoying
            // else {
            //     revert SampleAlreadyExists(ids[i]);
            // }
        }
    }

    function getSampleData(bytes4 id) public view returns (bytes memory) {
        return samples[id].data;
    }

    function getSampleDatas(bytes4[] calldata ids) public view returns (bytes[] memory sampleData) {
        sampleData = new bytes[](ids.length);
        for (uint8 i = 0; i < ids.length; i++) {
            sampleData[i] = samples[ids[i]].data;
        }
    }

    function getExistingSampleIDs(bytes4[] calldata ids)
        public
        view
        returns (bytes4[] memory existingSampleIDs, uint8 smpCount)
    {
        existingSampleIDs = new bytes4[](ids.length);
        for (uint8 i = 0; i < ids.length; i++) {
            if (samples[ids[i]].data.length > 0) {
                existingSampleIDs[smpCount] = ids[i];
                smpCount++;
            }
        }

        // TODO: Set the length of the `existingSampleIDs` to the actual length if possible (mstore?)
        // existingSampleIDs.length = smpCount;
    }
}
