/** @format */

export function getGasEstimate(kbs: number): number {
    // 1k 640000 gas
    return kbs * 640000;
}
