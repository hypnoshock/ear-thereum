/** @format */

export function getSampleKbs(sampleData: Uint8Array) {
    return Math.round((sampleData.length / 1024) * 100) / 100;
}
