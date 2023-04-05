const fs = require("fs");
const pako = require('pako');
const { ethers } = require("ethers");

const ID_LEN = 4; // bytes

const xmBytes = fs.readFileSync("./mods/luumukii.xm");

/*
 * Separates the sample data from the XM putting IDs in place of the data for lookup
 */
function stripXM(xmBytes) {
    console.log("Stripping XM file. Size: ", xmBytes.length);
    console.log(xmBytes);
    
    const headerSize = xmBytes.readInt32LE(60);
    
    // -- HEADER

    // The header consists of a sub header and an extended header
    // The extended header is designed to be of variable length and starts at offset 60 (includes size variable)
    const header = xmBytes.slice(0, 60 + headerSize);
    const numChan = header.readInt16LE(68);
    const numPat = header.readInt16LE(70);
    const numInst = header.readInt16LE(72);

    console.log('numChan: ', numChan);
    console.log('numPat: ', numPat);
    console.log('numInst: ', numInst);

    let currentReadOffset = 60 + headerSize;

    // -- PATTERNS
    const patterns = []; // contains headers and the pattern data
    for (let i = 0; i < numPat; i++) {
        const patHeaderLen = xmBytes.readInt16LE(currentReadOffset);
        const patHeader = xmBytes.slice(currentReadOffset, currentReadOffset + patHeaderLen);

        patterns.push(patHeader);

        const patDataSize = patHeader.readInt16LE(7);
        if (patDataSize == 0) {
            throw('Pattern data size is zero');
        }
        const patData = xmBytes.slice(currentReadOffset + patHeaderLen, currentReadOffset + patHeaderLen + patDataSize);
        patterns.push(patData);

        // patDataSize is variable
        currentReadOffset += patHeaderLen + patDataSize;
    }

    // -- INSTRUMENTS
    const instrumentOffset = currentReadOffset;
    const instruments = [];
    const samples = [];
    for (let i = 0; i < numInst; i++) {
        // Instrument header part 1
        const instHeaderSize = xmBytes.readInt32LE(currentReadOffset); // Is the size of both parts of the header
        const instHeader = xmBytes.slice(currentReadOffset, currentReadOffset + instHeaderSize);
        instruments.push(instHeader);
        currentReadOffset += instHeaderSize;       

        const instName = instHeader.slice(4, 4 + 22); // If I split intruments away from tune ID might be stored here
        // console.log("instName: ", instName.toString());
        const numSamples = instHeader.readInt16LE(27);
        
        if (numSamples > 0) {
            // Instrument header part 2
            const smpHeaderSize = instHeader.readInt32LE(29);
            const sampleLengths = [];

            // Sample headers
            for (let j = 0; j < numSamples; j++) {
                const smpHeader = xmBytes.slice(currentReadOffset, currentReadOffset + smpHeaderSize);
                // const smpName = smpHeader.slice(18, 18 + 22); // Used for ID lookup
                const smpLen = smpHeader.readInt32LE(0);
                sampleLengths.push(smpLen);
                instruments.push(smpHeader);
                currentReadOffset += smpHeaderSize;
            }

            // Sample data
            for (let j = 0; j < numSamples; j++) {
                const smpLen = sampleLengths[j];
                console.log(`inst: ${i} smpLen: ${smpLen}`);
                if (smpLen > 0) {
                    const smpDeltas = xmBytes.slice(currentReadOffset, currentReadOffset + smpLen);
                    samples.push(smpDeltas);
                    currentReadOffset += smpLen; // When restoring from blockchain we only inc 4 bytes for the IDs
                } else {
                    console.log(`instrument: ${i} empty sample: ${j}`);
                }
            }
        }
    }

    // NOTE: Sample headers are still in the module
    const strippedXM = Buffer.concat([header, ...patterns, ...instruments]);

    return {strippedXM, instrumentOffset, samples};
}

/**
 * WARNING: Mutates the buffer directly
 * Sets the sample name on each of the samples to the keccak hash so they can be referenced later
 */
function setSampleIDsInXM(xmBytes, sampleIDs) {
    console.log("Setting sample names to IDs. sameleIDs.length: ", sampleIDs.length);
    // console.log(sampleIDs);
    
    const headerSize = xmBytes.readInt32LE(60);
    
    // -- HEADER

    // The header consists of a sub header and an extended header
    // The extended header is designed to be of variable length and starts at offset 60 (includes size variable)
    const header = xmBytes.slice(0, 60 + headerSize);
    const numChan = header.readInt16LE(68);
    const numPat = header.readInt16LE(70);
    const numInst = header.readInt16LE(72);

    let currentReadOffset = 60 + headerSize;

    // -- PATTERNS
    for (let i = 0; i < numPat; i++) {
        const patHeaderLen = xmBytes.readInt16LE(currentReadOffset);
        const patHeader = xmBytes.slice(currentReadOffset, currentReadOffset + patHeaderLen);
        
        const patDataSize = patHeader.readInt16LE(7);
        console.log(
            `patHeaderLen: ${patHeaderLen} patHeader.length: ${
                patHeader.length
            } patDataSize: ${patDataSize} currentReadOffset: ${currentReadOffset} next: ${
                currentReadOffset + patHeaderLen + patDataSize
            }`
        );
        if (patDataSize == 0) {
            throw('Pattern data size is zero');
        }
        currentReadOffset += patHeaderLen + patDataSize;
    }

    // -- INSTRUMENTS
    let sampleNum = 0;
    for (let i = 0; i < numInst; i++) {        
        // Instrument header part 1
        const instHeaderSize = xmBytes.readInt32LE(currentReadOffset); // Is the size of both parts of the header
        const instHeader = xmBytes.slice(currentReadOffset, currentReadOffset + instHeaderSize);
        currentReadOffset += instHeaderSize;       

        // If I split intruments away from tune, ID might be stored here
        // const instName = instHeader.slice(4, 4 + 22); 

        const numSamples = instHeader.readInt16LE(27);        
        if (numSamples > 0) {
            // Instrument header part 2
            const smpHeaderSize = instHeader.readInt32LE(29);

            // Sample headers
            for (let j = 0; j < numSamples; j++) {
                const smpLen = xmBytes.readInt32LE(currentReadOffset);

                if (smpLen > 0) {
                    const nameOffset = currentReadOffset + 18;
                    const nameLen = 22;
                    const smpName = xmBytes.slice(nameOffset, nameOffset + nameLen); // Used for ID lookup
                    // console.log("old name: ", smpName.toString());
    
                    // We are storing the ID as hex string not as bytes. Idea being keep the names human readable for now
                    const idStr = sampleIDs[sampleNum];
                    const idStrBytes = Buffer.from(idStr, 'ascii');
    
                    for (let k = 0; k < nameLen; k++) {
                        xmBytes[nameOffset + k] = k < idStrBytes.length ? idStrBytes[k] : 0
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

/*
 * Uses DEFLATE to compress samples. IDs are 4 byte keccak of compressed data
 */
function compressSamples(samples) {
    const compressedSmpsDict = {};
    const sampleIDs = [];
    
    for (let i = 0; i < samples.length; i++) {
        const smpDeltas = samples[i];
        const deflator = new pako.Deflate();
        deflator.push(smpDeltas, true) 

        // 4 bytes of the keccak. NOTE: keccak string includes 0x prefix
        const id = ethers.keccak256(deflator.result).slice(2, 2 + (ID_LEN * 2)); 
        sampleIDs.push(id);
        compressedSmpsDict[id] = deflator.result;
    }

    return { compressedSmpsDict, sampleIDs };
}

function decompressSamples(compressedSmpsDict) {
    const smpsDict = {};

    for (let id in compressedSmpsDict) {
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
function compressXM(xmBytes) {
    const deflator = new pako.Deflate();
    deflator.push(xmBytes, true) 
    return deflator.result;
}

/*
 * Uses INFLATE
 */
function decompressXM(xmBytes) {
    const inflator = new pako.Inflate();
    inflator.push(xmBytes, true)

    return Buffer.from(inflator.result.buffer);
}

function writeSamples(compressedSamples) {
    for (let id in compressedSamples) {
        const sample = compressedSamples[id];
        fs.writeFileSync(`./out/${id}.deflate`, sample);
    }
}

// reconstructXM(xmBytes, samples);
function reconstructXM(xmBytes, smpsDict) {
    console.log("Recontructing XM file");
    console.log(xmBytes);
    const headerSize = xmBytes.readInt32LE(60);
    
    // -- HEADER

    // The header consists of a sub header and an extended header
    // The extended header is designed to be of variable length and starts at offset 60 (includes size variable)
    const header = xmBytes.slice(0, 60 + headerSize);
    const numChan = header.readInt16LE(68);
    const numPat = header.readInt16LE(70);
    const numInst = header.readInt16LE(72);

    // console.log('numChan: ', numChan);
    // console.log('numPat: ', numPat);
    // console.log('numInst: ', numInst);

    let currentReadOffset = 60 + headerSize;

    // -- PATTERNS
    const patterns = []; // contains headers and the pattern data
    for (let i = 0; i < numPat; i++) {
        const patHeaderLen = xmBytes.readInt16LE(currentReadOffset);
        const patHeader = xmBytes.slice(currentReadOffset, currentReadOffset + patHeaderLen);

        patterns.push(patHeader);

        const patDataSize = patHeader.readInt16LE(7);
        if (patDataSize == 0) {
            throw('Pattern data size is zero');
        }
        const patData = xmBytes.slice(currentReadOffset + patHeaderLen, currentReadOffset + patHeaderLen + patDataSize);
        patterns.push(patData);

        // patDataSize is variable
        currentReadOffset += patHeaderLen + patDataSize;
    }

    // -- INSTRUMENTS
    const instruments = [] 
    for (let i = 0; i < numInst; i++) {
        // Instrument header part 1
        const instHeaderSize = xmBytes.readInt32LE(currentReadOffset); // Is the size of both parts of the header
        const instHeader = xmBytes.slice(currentReadOffset, currentReadOffset + instHeaderSize);
        instruments.push(instHeader);
        currentReadOffset += instHeaderSize;       

        const instName = instHeader.slice(4, 4 + 22); // If I split intruments away from tune ID might be stored here
        console.log("instName: ", instName.toString());
        const numSamples = instHeader.readInt16LE(27);
        
        if (numSamples > 0) {
            // Instrument header part 2
            const smpHeaderSize = instHeader.readInt32LE(29);
            const sampleLengths = [];
            const sampleIDs = [];

            // Sample headers
            for (let j = 0; j < numSamples; j++) {
                const smpHeader = xmBytes.slice(currentReadOffset, currentReadOffset + smpHeaderSize);
                const smpName = smpHeader.slice(18, 18 + (ID_LEN * 2)); // Used for ID lookup. NOTE: because it's a hex string it's bytes * 2
                const smpLen = smpHeader.readInt32LE(0);
                const smpID = smpName.toString();
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
                    throw(`sample data empty for sample ${j} ID: '${id}'`);
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

function deltasToSamples(deltas) {
    var samples = Buffer.alloc(deltas.length);
    var prevSamp = 0;
    for (var i = 0; i < deltas.length; i++) {
        var newSamp = deltas[i] + prevSamp;
        samples[i] = newSamp; 
        prevSamp = newSamp;
    }
    return samples;
}

// --------- //

const {strippedXM, samples} = stripXM(xmBytes);
console.log("stripped XM size: ", strippedXM.length);
console.log("sample data dize: ", samples.reduce( (acc, elm) => acc + elm.length, 0));

const {compressedSmpsDict, sampleIDs} = compressSamples(samples);
console.log("compressed sample data dize: ", sampleIDs.reduce( (acc, id) => acc + compressedSmpsDict[id].length, 0));
// writeSamples(compressedSmpsDict);

setSampleIDsInXM(strippedXM, sampleIDs);

const compressedXM = compressXM(strippedXM);
console.log("compressed XM size: ", compressedXM.length);

// -- Reconstruct
const decompressedXM = decompressXM(compressedXM);
// const fetchedSampleIDs = getSampleIDs(decompressedXM); // TODO: Fetch from XM file
// const compressedSmpsDict = fetchSamples(fetchedSampleIDs); // TODO: Fetch from blockchain
const decompressedSmpsDict = decompressSamples(compressedSmpsDict);
const reconstructedXM = reconstructXM(decompressedXM, decompressedSmpsDict);
fs.writeFileSync(`./out/reconstructed.xm`, reconstructedXM);