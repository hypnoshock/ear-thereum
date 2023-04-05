/** @format */

import { ethers } from 'ethers';
import pako from 'pako';

export const ID_LEN = 4; // bytes

export type SamplesDict = {
    [key: string]: Uint8Array;
};

/*
 * Separates the sample data from the XM putting IDs in place of the data for lookup
 */
export function stripXM(xmBytes: Uint8Array) {
    console.log('Stripping XM file. Size: ', xmBytes.length);

    const headerSize = new DataView(xmBytes.buffer, 60, 4).getInt32(0, true);

    // -- HEADER

    // The header consists of a sub header and an extended header
    // The extended header is designed to be of variable length and starts at offset 60 (includes size variable)
    const header = xmBytes.slice(0, 60 + headerSize);
    const numChan = new DataView(header.buffer, 68, 2).getInt16(0, true);
    const numPat = new DataView(header.buffer, 70, 2).getInt16(0, true);
    const numInst = new DataView(header.buffer, 72, 2).getInt16(0, true);

    console.log('numChan: ', numChan);
    console.log('numPat: ', numPat);
    console.log('numInst: ', numInst);

    let currentReadOffset = 60 + headerSize;

    // -- PATTERNS
    const patterns: Uint8Array[] = []; // contains headers and the pattern data
    for (let i = 0; i < numPat; i++) {
        const patHeaderLen = new DataView(xmBytes.buffer, currentReadOffset, 2).getInt16(0, true);
        const patHeader = xmBytes.slice(currentReadOffset, currentReadOffset + patHeaderLen);

        patterns.push(patHeader);

        const patDataSize = new DataView(patHeader.buffer, 7, 2).getInt16(0, true);
        if (patDataSize == 0) {
            throw 'Pattern data size is zero';
        }
        const patData = xmBytes.slice(currentReadOffset + patHeaderLen, currentReadOffset + patHeaderLen + patDataSize);
        patterns.push(patData);

        // patDataSize is variable
        currentReadOffset += patHeaderLen + patDataSize;
    }

    // -- INSTRUMENTS
    const instrumentOffset = currentReadOffset;
    const instruments: Uint8Array[] = [];
    const samples: Uint8Array[] = [];
    for (let i = 0; i < numInst; i++) {
        // Instrument header part 1
        const instHeaderSize = new DataView(xmBytes.buffer, currentReadOffset, 4).getInt32(0, true); // Is the size of both parts of the header
        const instHeader = xmBytes.slice(currentReadOffset, currentReadOffset + instHeaderSize);
        instruments.push(instHeader);
        currentReadOffset += instHeaderSize;

        // const instName = instHeader.slice(4, 4 + 22); // If I split intruments away from tune ID might be stored here
        // console.log("instName: ", instName.toString());
        const numSamples = new DataView(instHeader.buffer, 27, 2).getInt16(0, true);

        if (numSamples > 0) {
            // Instrument header part 2
            const smpHeaderSize = new DataView(instHeader.buffer, 29, 4).getInt32(0, true);
            const sampleLengths = [];

            // Sample headers
            for (let j = 0; j < numSamples; j++) {
                const smpHeader = xmBytes.slice(currentReadOffset, currentReadOffset + smpHeaderSize);
                // const smpName = smpHeader.slice(18, 18 + 22); // Used for ID lookup
                const smpLen = new DataView(smpHeader.buffer, 0, 4).getInt32(0, true);
                sampleLengths.push(smpLen);
                instruments.push(smpHeader);
                currentReadOffset += smpHeaderSize;
            }

            // Sample data
            for (let j = 0; j < numSamples; j++) {
                const smpLen = sampleLengths[j];
                if (smpLen > 0) {
                    const smpDeltas = xmBytes.slice(currentReadOffset, currentReadOffset + smpLen);
                    samples.push(smpDeltas);

                    currentReadOffset += smpLen; // When restoring from blockchain we only inc 4 bytes for the IDs
                }
            }
        }
    }

    // NOTE: Sample headers are still in the module
    const strippedXM = Buffer.concat([header, ...patterns, ...instruments]);

    return { strippedXM, instrumentOffset, samples };
}

/*
 * Uses DEFLATE to compress samples. IDs are 4 byte keccak of compressed data
 */
export function compressSamples(samples: Uint8Array[]) {
    const compressedSmpsDict = {};
    const sampleIDs = [];

    for (let i = 0; i < samples.length; i++) {
        const smpDeltas = samples[i];
        const deflator = new pako.Deflate();
        deflator.push(smpDeltas, true);

        // 4 bytes of the keccak. NOTE: keccak string includes 0x prefix
        const id = ethers.keccak256(deflator.result).slice(2, 2 + ID_LEN * 2);
        sampleIDs.push(id);
        compressedSmpsDict[id] = deflator.result;
    }

    return { compressedSmpsDict, sampleIDs };
}

export function decompressSamples(compressedSmpsDict: SamplesDict) {
    const smpsDict = {};

    for (const id in compressedSmpsDict) {
        const inflator = new pako.Inflate();
        inflator.push(compressedSmpsDict[id], true);

        smpsDict[id] = inflator.result; // use Buffer.from?

        // console.log(`compressedSmpsDict[id].length: ${compressedSmpsDict[id].length}`);
        console.log(`${id}: ${inflator.result.length}`);
    }

    return smpsDict;
}

/*
 * Uses DEFLATE to compress
 */
export function compressXM(xmBytes: Uint8Array) {
    const deflator = new pako.Deflate();
    deflator.push(xmBytes, true);
    return deflator.result;
}

/*
 * Uses INFLATE
 */
export function decompressXM(xmBytes: Uint8Array) {
    const inflator = new pako.Inflate();
    inflator.push(xmBytes, true);

    if (inflator.result instanceof Uint8Array) {
        return inflator.result;
    }

    throw `decompressXM: result of decompression wasn't a buffer`;
}

export function setSampleIDsInXM(xmBytes: Uint8Array, sampleIDs: string[]): void {
    console.log('Setting sample names to IDs. sameleIDs.length: ', sampleIDs.length);
    // console.log(sampleIDs);

    const headerSize = new DataView(xmBytes.buffer, 60, 4).getInt32(0, true);

    // -- HEADER

    // The header consists of a sub header and an extended header
    // The extended header is designed to be of variable length and starts at offset 60 (includes size variable)
    const header = xmBytes.slice(0, 60 + headerSize);
    const numChan = new DataView(header.buffer, 68, 2).getInt16(0, true);
    const numPat = new DataView(header.buffer, 70, 2).getInt16(0, true);
    const numInst = new DataView(header.buffer, 72, 2).getInt16(0, true);

    let currentReadOffset = 60 + headerSize;

    // -- PATTERNS
    for (let i = 0; i < numPat; i++) {
        const patHeaderLen = new DataView(xmBytes.buffer, currentReadOffset, 2).getInt16(0, true);
        const patHeader = xmBytes.slice(currentReadOffset, currentReadOffset + patHeaderLen);

        // const patDataSize = new DataView(patHeader.buffer, 7, 2).getInt16(0, true); // doesn't work
        const patDataSize = new DataView(xmBytes.buffer, currentReadOffset, patHeaderLen).getInt16(7, true);
        console.log(
            `patHeaderLen: ${patHeaderLen} patHeader.length: ${
                patHeader.length
            } patDataSize: ${patDataSize} currentReadOffset: ${currentReadOffset} next: ${
                currentReadOffset + patHeaderLen + patDataSize
            }`
        );
        if (patDataSize == 0) {
            throw new Error('Pattern data size is zero');
        }
        currentReadOffset += patHeaderLen + patDataSize;
    }

    // -- INSTRUMENTS
    let sampleNum = 0;
    for (let i = 0; i < numInst; i++) {
        // Instrument header part 1
        const instHeaderSize = new DataView(xmBytes.buffer, currentReadOffset, 4).getInt32(0, true); // Is the size of both parts of the header
        const instHeader = new DataView(xmBytes.buffer, currentReadOffset, instHeaderSize); //xmBytes.slice(currentReadOffset, currentReadOffset + instHeaderSize);
        currentReadOffset += instHeaderSize;

        // If I split instruments away from tune, ID might be stored here
        // const instName = instHeader.slice(4, 4 + 22);

        const numSamples = instHeader.getInt16(27, true);
        if (numSamples > 0) {
            // Instrument header part 2
            const smpHeaderSize = instHeader.getInt32(29, true);

            // Sample headers
            for (let j = 0; j < numSamples; j++) {
                const smpLen = new DataView(xmBytes.buffer, currentReadOffset, 4).getInt32(0, true);
                if (smpLen > 0) {
                    const nameOffset = currentReadOffset + 18;
                    const nameLen = 22;
                    // const smpName = xmBytes.slice(nameOffset, nameOffset + nameLen); // Used for ID lookup
                    // console.log("old name: ", smpName.toString());

                    // We are storing the ID as hex string not as bytes. Idea being keep the names human readable for now
                    const idStrBytes = Buffer.from(sampleIDs[sampleNum], 'ascii');

                    for (let k = 0; k < nameLen; k++) {
                        if (k < idStrBytes.length) {
                            xmBytes[nameOffset + k] = idStrBytes[k];
                        } else {
                            xmBytes[nameOffset + k] = 0;
                        }
                    }

                    const newSmpName = xmBytes.slice(nameOffset, nameOffset + nameLen); // Used for ID lookup
                    console.log(`${sampleNum} name: `, newSmpName.toString());
                    sampleNum++; // Gobal counter so not j
                }

                currentReadOffset += smpHeaderSize;
            }
        }
    }
}

export function reconstructXM(xmBytes: Uint8Array, smpsDict: SamplesDict): Uint8Array {
    console.log('Recontructing XM file');
    console.log(xmBytes);
    const headerSize = new DataView(xmBytes.buffer, 60, 4).getInt32(0, true);

    // -- HEADER

    // The header consists of a sub header and an extended header
    // The extended header is designed to be of variable length and starts at offset 60 (includes size variable)
    const header = xmBytes.slice(0, 60 + headerSize);
    const numChan = new DataView(header.buffer, 68, 2).getInt16(0, true);
    const numPat = new DataView(header.buffer, 70, 2).getInt16(0, true);
    const numInst = new DataView(header.buffer, 72, 2).getInt16(0, true);

    // console.log('numChan: ', numChan);
    // console.log('numPat: ', numPat);
    // console.log('numInst: ', numInst);

    let currentReadOffset = 60 + headerSize;

    // -- PATTERNS
    const patterns: Uint8Array[] = []; // contains headers and the pattern data
    for (let i = 0; i < numPat; i++) {
        const patHeaderLen = new DataView(xmBytes.buffer, currentReadOffset, 2).getInt16(0, true);
        const patHeader = xmBytes.slice(currentReadOffset, currentReadOffset + patHeaderLen);

        patterns.push(patHeader);

        const patDataSize = new DataView(patHeader.buffer, 7, 2).getInt16(0, true);
        if (patDataSize == 0) {
            throw 'Pattern data size is zero';
        }
        const patData = xmBytes.slice(currentReadOffset + patHeaderLen, currentReadOffset + patHeaderLen + patDataSize);
        patterns.push(patData);

        // patDataSize is variable
        currentReadOffset += patHeaderLen + patDataSize;
    }

    // -- INSTRUMENTS
    const instruments: Uint8Array[] = [];
    for (let i = 0; i < numInst; i++) {
        // Instrument header part 1
        const instHeaderSize = new DataView(xmBytes.buffer, currentReadOffset, 4).getInt32(0, true); // Is the size of both parts of the header
        const instHeader = xmBytes.slice(currentReadOffset, currentReadOffset + instHeaderSize);
        instruments.push(instHeader);
        currentReadOffset += instHeaderSize;

        const instName = instHeader.slice(4, 4 + 22); // If I split intruments away from tune ID might be stored here
        console.log('instName: ', new TextDecoder().decode(instName));
        const numSamples = new DataView(instHeader.buffer, 27, 2).getInt16(0, true);

        if (numSamples > 0) {
            // Instrument header part 2
            const smpHeaderSize = new DataView(instHeader.buffer, 29, 4).getInt32(0, true);
            const sampleLengths: number[] = [];
            const sampleIDs: string[] = [];

            // Sample headers
            for (let j = 0; j < numSamples; j++) {
                const smpHeader = xmBytes.slice(currentReadOffset, currentReadOffset + smpHeaderSize);
                const smpName = smpHeader.slice(18, 18 + ID_LEN * 2); // Used for ID lookup. NOTE: because it's a hex string it's bytes * 2
                const smpLen = new DataView(smpHeader.buffer, 0, 4).getInt32(0, true);
                const smpID = new TextDecoder().decode(smpName); // smpName.toString(); Doesn't work although toString worked earlier?
                sampleLengths.push(smpLen);
                sampleIDs.push(smpID);

                instruments.push(smpHeader);
                currentReadOffset += smpHeaderSize;
            }

            // Sample data
            for (let j = 0; j < numSamples; j++) {
                if (sampleLengths[j] == 0) continue;

                const id = sampleIDs[j];
                const smpData = smpsDict[id];
                if (smpData == undefined) {
                    throw `sample data empty for sample ${j} ID: '${id}'`;
                }

                if (smpData.length != sampleLengths[j]) {
                    console.warn(`Sample ${j} length mismatch. ID: ${sampleIDs[j]}`);
                }

                // Reinject sample data
                instruments.push(smpData);

                // NOTE: We are storing the IDs in the sample names instead of where the sample data
                // was so no need to increment as we are already pointing at the next header
                // currentReadOffset += ID_LEN;
            }
        }
    }

    const reconstructedXMBytes = Buffer.concat([header, ...patterns, ...instruments]);
    return reconstructedXMBytes;
}
