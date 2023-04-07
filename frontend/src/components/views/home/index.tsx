/** @format */

import { FunctionComponent, ReactNode, useState } from 'react';
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
import { useEarThereumContext } from '@app/contexts/ear-thereum-provider';
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
    const { status, connect, account, chainId } = useMetaMask();
    const onChainSampleIDs: string[] = []; //'a5c634d8'
    // const { incCount, count } = useEarThereumContext();
    const [selectedSampleIDs, setSelectedSampleIDs] = useState<string[]>([]);
    const [sampleIDs, setSampleIDs] = useState<string[]>();
    const [compressedSmpsDict, setCompressedSmpsDict] = useState<SamplesDict | null>(null);
    const [compressedXM, setCompressedXM] = useState<Uint8Array | null>(null);
    const gasEstimate = getGasEstimate(compressedSmpsDict, selectedSampleIDs, compressedXM);
    const transactionEstimate = gasEstimate / MAX_GAS_PER_TX;

    const onFiles = (files: FileList) => {
        if (files.length > 0) {
            files[0].arrayBuffer().then((xmBytes) => {
                const { sampleIDs, compressedSmpsDict, compressedXM } = processXM(xmBytes);
                const uniqueSampleIDs = sampleIDs.filter((sampleID, idx, self) => {
                    return self.indexOf(sampleID) === idx;
                });
                setSampleIDs(uniqueSampleIDs);
                setSelectedSampleIDs(uniqueSampleIDs);
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

    // Fetch sample data from blockchain
    const fetchSamples = (sampleIDs: string[]) => {
        return null; // not implemented
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

    function getGasEstimate(
        smpsDict: SamplesDict | null,
        uploadSampleIDs: string[],
        compressedXM: Uint8Array | null
    ): number {
        const sampleKbs = getSampleKbs(smpsDict, uploadSampleIDs);
        const xmKbs = getXMKbs(compressedXM);
        // 1k 640000 gas
        return (sampleKbs + xmKbs) * 640000;
    }

    function handleSelectAll() {
        if (!sampleIDs) return;

        const notOnChain = sampleIDs.filter((sampleID) => {
            return !onChainSampleIDs.includes(sampleID);
        });

        setSelectedSampleIDs(notOnChain);
    }

    function handleDeselectAll() {
        setSelectedSampleIDs([]);
    }

    return (
        <StyledHome {...otherProps}>
            <h1>Ear-thereum</h1>
            <DragDropFile onFiles={onFiles} />
            <button onClick={handleConnectClick}>Connect</button>
            {account && <p>Account: {account}</p>}
            {chainId && <p>Chain: {parseInt(chainId, 16)}</p>}
            {sampleIDs && (
                <SamplesList
                    sampleIDs={sampleIDs}
                    onChainSampleIDs={onChainSampleIDs}
                    selectedSampleIDs={selectedSampleIDs}
                    onItemSelectChange={handleItemSelectChange}
                />
            )}
            {sampleIDs && <button onClick={handleSelectAll}>Select All</button>}
            {sampleIDs && <button onClick={handleDeselectAll}>Deselect All</button>}
            <p>XM Kb: {getXMKbs(compressedXM)}</p>
            <p>Sample Kb: {getSampleKbs(compressedSmpsDict, selectedSampleIDs)}</p>
            <p>Total Kb: {getXMKbs(compressedXM) + getSampleKbs(compressedSmpsDict, selectedSampleIDs)}</p>
            <p>Estimated Gas: {gasEstimate}</p>
            <p>Estimated transaction count: {transactionEstimate}</p>
            {/* TODO: Fix below */}
            {transactionEstimate < 1 && sampleIDs && <button>Upload XM and Samples</button>}
            {transactionEstimate >= 1 && getSampleKbs(compressedSmpsDict, selectedSampleIDs) > 0 && (
                <button>Upload Samples</button>
            )}
            {transactionEstimate < 1 && onChainSampleIDs.length == onChainSampleIDs.length && (
                <button>Upload XM</button>
            )}
        </StyledHome>
    );
};
