/** @format */

import { Fragment, FunctionComponent, ReactNode, useEffect, useState } from 'react';
import styled from 'styled-components';
import { ComponentProps } from '@app/types/component-props';
import { styles } from './home.styles';
import { DragDropFile } from '@app/components/molecules/drag-drop-file';
import {
    compressSamples,
    compressXM,
    decompressSamples,
    decompressXM,
    getXMInfo,
    reconstructXM,
    SamplesDict,
    setSampleIDsInXM,
    stripXM
} from '@app/utils/xm-tools';
import { useMetaMask } from 'metamask-react';
import { EarThereumContext, useEarThereumContext } from '@app/contexts/ear-thereum-provider';
import { SamplesList } from '@app/components/molecules/samples-list';

export interface HomeProps extends ComponentProps {
    children?: ReactNode;
}

const StyledHome = styled('div')`
    ${styles}
`;

const MAX_GAS_PER_TX = 15000000;

export const Home: FunctionComponent<HomeProps> = (props: HomeProps) => {
    const { children, ...otherProps } = props;
    const { connect, account, chainId, status } = useMetaMask();
    const { earThereumContract, getExistingSampleIDs, convertIDsToBytes4 } = useEarThereumContext();
    const [selectedSampleIDs, setSelectedSampleIDs] = useState<string[]>([]);
    const [sampleIDs, setSampleIDs] = useState<string[]>([]);
    const [existingSampleIDs, setExistingSampleIDs] = useState<string[]>([]);
    const [compressedSmpsDict, setCompressedSmpsDict] = useState<SamplesDict | null>(null);
    const [compressedXM, setCompressedXM] = useState<Uint8Array | null>(null);

    const xmKbs = getXMKbs(compressedXM);
    const xmGas = getGasEstimate(xmKbs);
    const sampleKbs = getSampleKbs(compressedSmpsDict, selectedSampleIDs);
    const sampleGas = getGasEstimate(sampleKbs);
    const xmTransactionCount = xmGas / MAX_GAS_PER_TX;
    const samplesTransactionCount = sampleGas / MAX_GAS_PER_TX;
    const totalTransactionCount = xmTransactionCount + samplesTransactionCount;

    const onFiles = (files: FileList) => {
        if (files.length > 0) {
            files[0].arrayBuffer().then((xmBytes) => {
                const { sampleIDs, compressedSmpsDict, compressedXM } = processXM(xmBytes);
                const uniqueSampleIDs = sampleIDs.filter((sampleID, idx, self) => {
                    return self.indexOf(sampleID) === idx;
                });
                setSampleIDs(uniqueSampleIDs);
                setSelectedSampleIDs([]);
                setCompressedSmpsDict(compressedSmpsDict);
                setCompressedXM(compressedXM);
            });
        }
    };

    const processXM = (xmBytes: ArrayBuffer) => {
        const { strippedXM, samples } = stripXM(new Uint8Array(xmBytes));
        const { compressedSmpsDict, sampleIDs } = compressSamples(samples);
        setSampleIDsInXM(strippedXM, sampleIDs);
        const compressedXM = compressXM(strippedXM);

        return {
            strippedXM,
            compressedXM,
            compressedSmpsDict,
            sampleIDs
        };
    };

    // const fetchXM = (xmID: string) => {
    //     const compressedXM = fetchXMFromChain(xmID);
    //     const compressedSmpsDict = fetchSamplesFromChain(sampleIDs);

    //     return { compressedXM, compressedSmpsDict };
    // };

    // const reconstructXM = (compressedXM: Uint8Array, compressedSmpsDict: SamplesDict) => {
    //     const decompressedXM = decompressXM(compressedXM);
    //     const { sampleIDs } = getXMInfo(decompressedXM);

    //     const decompressedSmpsDict = decompressSamples(compressedSmpsDict);
    //     const reconstructedXM = reconstructXM(decompressedXM, decompressedSmpsDict);

    //     return reconstructedXM;
    //     // downloadFile(reconstructedXM, 'reconstructed.xm');
    // };

    const handleItemSelectChange = (sampleID: string, isChecked: boolean) => {
        if (isChecked) {
            if (!selectedSampleIDs.includes(sampleID)) {
                // Could I have pushed on the element or should I make a new array?
                setSelectedSampleIDs([...selectedSampleIDs, sampleID]);
            }
        } else {
            const updatedList = selectedSampleIDs.filter((elm) => elm != sampleID);
            setSelectedSampleIDs(updatedList);
        }
    };

    // Better way of doing this?
    const downloadFile = (data: Uint8Array, filename: string) => {
        const blob = new Blob([data], { type: 'application/octet-stream' });

        const url = URL.createObjectURL(blob);

        // Create a hidden anchor element with the download attribute set to the filename
        const anchor = document.createElement('a');
        anchor.style.display = 'none';
        anchor.download = filename;
        anchor.href = url;

        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
    };

    const handleConnectClick = () => {
        connect();
    };

    function getSampleKbs(smpsDict: SamplesDict | null, uploadSampleIDs: string[]): number {
        if (!smpsDict) return 0;

        return (
            uploadSampleIDs.reduce((acc, sampleID) => {
                return smpsDict[sampleID].length + acc;
            }, 0) / 1024
        );
    }

    function getXMKbs(compressedXM: Uint8Array | null) {
        return compressedXM ? compressedXM.length / 1024 : 0;
    }

    function getGasEstimate(kbs: number): number {
        // 1k 640000 gas
        return kbs * 640000;
    }

    function handleSelectAll() {
        if (sampleIDs.length == 0) return;

        const notOnChain = sampleIDs.filter((sampleID) => {
            return !existingSampleIDs.includes(sampleID);
        });

        setSelectedSampleIDs(notOnChain);
    }

    function handleDeselectAll() {
        setSelectedSampleIDs([]);
    }

    async function handleUploadSamplesClick() {
        if (earThereumContract && compressedSmpsDict && selectedSampleIDs.length > 0) {
            const sampleData = selectedSampleIDs.map((sampleID) => {
                if (!compressedSmpsDict[sampleID]) {
                    throw `Sample '${sampleID}' doesn't exist in compressedSmpsDic`;
                }
                return compressedSmpsDict[sampleID];
            });

            // Keep firing off transactions until we're done
            const transactions = [];
            let startIdx = 0;
            let endIdx = 1;
            while (startIdx < selectedSampleIDs.length) {
                const batchSampleIDs = convertIDsToBytes4(selectedSampleIDs.slice(startIdx, endIdx));
                const batchSampleData = sampleData.slice(startIdx, endIdx);

                console.log(
                    `batchSampleIDs.length: ${batchSampleIDs.length} batchSampleData.length: ${batchSampleData.length}`
                );
                console.log(`Attempting to upload the following: `, batchSampleIDs, batchSampleData);

                const tx = await earThereumContract.uploadSamples(batchSampleIDs, batchSampleData);
                transactions.push(tx.wait());
                startIdx = endIdx;
                endIdx = endIdx + 1;
            }

            await Promise.all(transactions);

            console.log('ALL DONE!');
        }
    }

    useEffect(() => {
        if (sampleIDs && sampleIDs.length > 0) {
            (async () => {
                const existingSampleIDs = await getExistingSampleIDs(sampleIDs);
                setExistingSampleIDs(existingSampleIDs);
            })();
        }
    }, [getExistingSampleIDs, sampleIDs]);

    // // Ensure we're not selecting any that have already been uploaded
    // if (selectedSampleIDs.length > 0) {
    //     const filtered = selectedSampleIDs.filter((sampleID) => {
    //         return !existingSampleIDs.includes(sampleID);
    //     });
    //     setSelectedSampleIDs(filtered);
    // }

    function DisplayMainView() {
        return (
            <Fragment>
                <DragDropFile onFiles={onFiles} />
                {sampleIDs && (
                    <SamplesList
                        sampleIDs={sampleIDs}
                        onChainSampleIDs={existingSampleIDs}
                        selectedSampleIDs={selectedSampleIDs}
                        onItemSelectChange={handleItemSelectChange}
                    />
                )}
                {sampleIDs.length > 0 && <button onClick={handleSelectAll}>Select All</button>}
                {sampleIDs.length > 0 && <button onClick={handleDeselectAll}>Deselect All</button>}
                <p>
                    XM Kb: {xmKbs} gas: {xmGas} transactions: {xmTransactionCount}
                </p>
                <p>
                    Sample Kb: {sampleKbs} gas: {sampleGas} transactions: {samplesTransactionCount}
                </p>
                <p>Total Kb: {xmKbs + sampleKbs}</p>
                <p>Total Gas: {sampleGas + xmGas}</p>
                <p>Total transaction count: {totalTransactionCount}</p>

                {selectedSampleIDs.length > 0 && <button onClick={handleUploadSamplesClick}>Upload Samples</button>}
                {compressedXM && xmTransactionCount < 1 && existingSampleIDs.length == sampleIDs.length && (
                    <button>Upload XM</button>
                )}
            </Fragment>
        );
    }

    return (
        <StyledHome {...otherProps}>
            <h1>Ear-thereum</h1>
            {status != 'connected' && <button onClick={handleConnectClick}>Connect</button>}
            {account && <p>Account: {account}</p>}
            {chainId && <p>Chain: {parseInt(chainId, 16)}</p>}
            {status == 'connected' && DisplayMainView()}
        </StyledHome>
    );
};
