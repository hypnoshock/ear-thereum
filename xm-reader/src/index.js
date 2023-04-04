const fs = require("fs");
var sanitize = require("sanitize-filename");
const FasttrackerXmModule = require("./types/FasttrackerXmModule");
const KaitaiStream = require('kaitai-struct/KaitaiStream');
// const lzwcompress = require('lzwcompress');
// const oggEncoder = require("vorbis-encoder-js").encoder;
const pako = require('pako');
const { ethers } = require("ethers");

const xmBytes = fs.readFileSync("./mods/luumukii.xm");
const data = new FasttrackerXmModule(new KaitaiStream(xmBytes));

const moduleName = sanitize(data.preheader.moduleName.trim()) || "unknown";
// const sampleDeltas = data.instruments[0].samples[0].data;

const sampleIds = [];
const unpackedSamples = {}; 

// Each instrument contains multiple samples
data.instruments.forEach( (inst, instIdx) => {
    const instName = sanitize(inst.header.name.trim()) || instIdx;
    inst.samples.forEach( (smp, smpIdx) => {
        const smpDeltas = smp.data;
        const smpName = sanitize(smp.header.name.trim()) || smpIdx;
        const bitRate = smp.header.type.isSampleData16Bit ? 16 : 8;

        // pack
        const deflator = new pako.Deflate();
        deflator.push(smpDeltas, true) 

        const id = ethers.keccak256(deflator.result).slice(2,6); // keccak includes 0x prefix
        sampleIds.push(id);

        fs.writeFileSync(`./out/${id}.deflate`, deflator.result);

        // Unpack
        const inflator = new pako.Inflate();
        inflator.push(deflator.result);
        const unpackedSample = inflator.result;
        unpackedSamples[id] = unpackedSample

        // fs.writeFileSync(`./out/${moduleName}_sample_${instIdx}_${instName}_${smpName}_${bitRate}bit.dlt.deflate`, deflator.result);
    });
});

writeXM(xmBytes)
function writeXM(xmBytes) {
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
    let sampleNum = 0; // because we aren't reading IDs yet
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
            console.log("smpHeaderSize: ", smpHeaderSize);
            
            const sampleLengths = [];

            // Sample headers
            for (let j = 0; j < numSamples; j++) {
                const smpHeader = xmBytes.slice(currentReadOffset, currentReadOffset + smpHeaderSize);
                const smpName = smpHeader.slice(18, 18 + 22); // Used for ID lookup
                const smpLen = smpHeader.readInt32LE(0);
                sampleLengths.push(smpLen);

                console.log('smpName: ', smpName.toString(), 'smpLen: ', smpLen);
                instruments.push(smpHeader);
                currentReadOffset += smpHeaderSize;
            }

            // Sample data
            for (let j = 0; j < numSamples; j++) {
                // Sample data where we spit out the data we retrieved from the chain
                const smpData = unpackedSamples[sampleIds[sampleNum]];
                instruments.push(smpData);
                sampleNum++;
                
                // Read 4 byte ID
                currentReadOffset += sampleLengths[j]; // When restoring from blockchain we only inc 4 bytes for the IDs
            }
        }

    }

    // -- WRITE FILE
    const patternDataLen = patterns.reduce((acc, elm) => acc + elm.length, 0);
    const xmFileLen = header.length + patternDataLen;
    const xmFile = Buffer.concat([header, ...patterns, ...instruments]);
    fs.writeFileSync(`./out/_processed.xm`, xmFile);
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

// old=0;
// for i=1 to len
//    new=sample[i]+old;
//    sample[i]=new;
//    old=new;



// My plan

// Save out all the instrumes as one big blob called a 'instrumentPack'
// Compress the pack with gzip or something ... something that I can unpack client side
// Upload the instrument pack to a `SamplePacks` contract which has either a mapping or array of these data blobs

// Do something similar with a .xm file that is pretty much stripped of anything I don't care about
// also gzipped

// Client end will retrieve the .xm and the separate instrument pack and reconstruct the .xm file to be played

// Thoughts:
// Maybe I want to upload the instruments as separate gzipped files so they can be used separately and not in a pack?
// For a demo it would be simpler just to use a big pack
// But if I wanted to use more than one pack I'd still need a way of encoding that I am using more than one pack
// My uploaded xm file needs to have a list of instrument IDs instead of data. Those IDs can be given to a contract and it'll give you all the data

// Can I make a platform where people can upload their XMs and I become the Beatport of XM files?
