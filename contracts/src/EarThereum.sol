// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

// type SampleID is bytes4; // -- This was more of a pain than it was worth. I had trouble converting from keccak to this

contract EarThereum {
    error SampleAlreadyExists(bytes4 id);
    error XMAlreadyExists(bytes4 id);
    error ArrayLengthMismatch(string reason);

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

    event SongUploaded(bytes4 id);
    event SampleUploaded(bytes4 id);

    mapping(bytes4 => Sample) public samples;
    mapping(bytes4 => bytes) public xm;

    function uploadSample(bytes4 id, bytes calldata data) public {
        if (samples[id].data.length > 0) revert SampleAlreadyExists(id);

        samples[id].data = data;
        emit SampleUploaded(id);
    }

    function uploadXM(bytes4 id, bytes calldata data) public {
        if (xm[id].length > 0) revert XMAlreadyExists(id);

        xm[id] = data;

        emit SongUploaded(id);
    }

    function uploadSamples(bytes4[] calldata ids, bytes[] calldata sampleData) public {
        if (ids.length != sampleData.length) {
            revert ArrayLengthMismatch("EarThereum: ArrayLengthMismatch");
        }

        for (uint8 i = 0; i < ids.length; i++) {
            if (samples[ids[i]].data.length == 0) {
                samples[ids[i]].data = sampleData[i];
            }
            // - No need to actually revert here, if anything probably annoying
            // else {
            //     revert SampleAlreadyExists(ids[i]);
            // }

            emit SampleUploaded(ids[i]);
        }
    }

    function getXM(bytes4 id) public view returns (bytes memory) {
        return xm[id];
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
