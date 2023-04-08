/** @format */

export const MAX_GAS_PER_TX = 15000000;

export function getGasEstimate(kbs: number): number {
    // 1k 640000 gas
    return kbs * 640000;
}
