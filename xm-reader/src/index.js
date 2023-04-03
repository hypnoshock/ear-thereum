const fs = require("fs");
var sanitize = require("sanitize-filename");
const FasttrackerXmModule = require("./types/FasttrackerXmModule");
const KaitaiStream = require('kaitai-struct/KaitaiStream');
// const lzwcompress = require('lzwcompress');
// const oggEncoder = require("vorbis-encoder-js").encoder;
const pako = require('pako');


const arrayBuffer = fs.readFileSync("./mods/luumukii.xm");
const data = new FasttrackerXmModule(new KaitaiStream(arrayBuffer));

const moduleName = sanitize(data.preheader.moduleName.trim()) || "unknown";
// const sampleDeltas = data.instruments[0].samples[0].data;

// Each instrument contains multiple samples
data.instruments.forEach( (inst, instIdx) => {
    const instName = sanitize(inst.header.name.trim()) || instIdx;
    inst.samples.forEach( (smp, smpIdx) => {
        const smpDeltas = smp.data;
        const smpName = sanitize(smp.header.name.trim()) || smpIdx;
        const bitRate = smp.header.type.isSampleData16Bit ? 16 : 8;

        const deflator = new pako.Deflate();
        deflator.push(smpDeltas, true) 
        fs.writeFileSync(`./out/${moduleName}_sample_${instIdx}_${instName}_${smpName}_${bitRate}bit.dlt.deflate`, deflator.result);
    });
})

function compress(data) {
    return lzwcompress.pack(data);
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
