/** @format */

import { Fragment, FunctionComponent, ReactNode, useEffect, useState } from 'react';
import styled from 'styled-components';
import { ComponentProps } from '@app/types/component-props';
import { styles } from './upload.styles';
import { DragDropFile } from '@app/components/molecules/drag-drop-file';
import {
    compressSamples,
    compressXM,
    getID,
    getXMInfo,
    SamplesDict,
    setSampleIDsInXM,
    stripXM
} from '@app/utils/xm-tools';
import { useMetaMask } from 'metamask-react';
import { useEarThereumContext } from '@app/contexts/ear-thereum-provider';
import { SamplesList } from '@app/components/molecules/samples-list';
import { getGasEstimate, MAX_GAS_PER_TX } from '@app/helpers/GasHelper';
import { getSampleKbs } from '@app/helpers/SampleHelper';

export interface UploadProps extends ComponentProps {
    children?: ReactNode;
}

const StyledUpload = styled('div')`
    ${styles}
`;

export const Upload: FunctionComponent<UploadProps> = (props: UploadProps) => {
    const { children, ...otherProps } = props;
    const { connect, account, chainId, status } = useMetaMask();
    const { earThereumContract, getExistingSampleIDs, convertIDsToBytes4 } = useEarThereumContext();
    const [selectedSampleIDs, setSelectedSampleIDs] = useState<string[]>([]);
    const [sampleIDs, setSampleIDs] = useState<string[]>([]);
    const [existingSampleIDs, setExistingSampleIDs] = useState<string[]>([]);
    const [compressedSmpsDict, setCompressedSmpsDict] = useState<SamplesDict | null>(null);
    const [compressedXM, setCompressedXM] = useState<Uint8Array | null>(null);
    const [xmFile, setXMFile] = useState<Uint8Array>();

    const xmKbs = getXMKbs(compressedXM);
    const xmGas = getGasEstimate(xmKbs);
    const sampleKbs = getSamplesInDictKbs(compressedSmpsDict, selectedSampleIDs);
    const sampleGas = getGasEstimate(sampleKbs);
    const xmTransactionCount = Math.ceil(xmGas / MAX_GAS_PER_TX);
    const samplesTransactionCount = Math.ceil(sampleGas / MAX_GAS_PER_TX);
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
                setXMFile(new Uint8Array(xmBytes));
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

    const handleConnectClick = () => {
        connect();
    };

    function getSamplesInDictKbs(smpsDict: SamplesDict | null, uploadSampleIDs: string[]): number {
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
                // Keep increasing the size of the batch until we hit our tx limit
                // TODO: Not very smart as it picks the next sample in the array instead of looking
                // the next that may fit
                let gasEstimate = 0;
                while (endIdx - 1 < sampleData.length) {
                    const sampleKbs = getSampleKbs(sampleData[endIdx - 1]);
                    const sampleGas = getGasEstimate(sampleKbs);
                    if ((gasEstimate + sampleGas) / MAX_GAS_PER_TX < 1) {
                        gasEstimate += sampleGas;
                        endIdx += 1;
                    } else {
                        break;
                    }
                }

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

    async function handleUploadXMClick() {
        if (!compressedXM || !earThereumContract) return;
        console.log('handleUploadXMClick');
        const id = getID(compressedXM);
        const tx = await earThereumContract.uploadXM('0x' + id, compressedXM);
        await tx.wait();
        console.log(`XM Uploaded: ${id}`);
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

    function showXMInfo(xmFile: Uint8Array) {
        const { moduleName, numChan, numPat, numInst } = getXMInfo(xmFile, true);
        return (
            <Fragment>
                <h2>Tune Info</h2>
                <p>
                    <span className="label">Name:</span> {moduleName}
                </p>
                <p>
                    <span className="label">Number of Channels:</span> {numChan}
                </p>
                <p>
                    <span className="label">Number of Patterns:</span> {numPat}
                </p>
                <p>
                    <span className="label">Number of Instruments:</span> {numInst}
                </p>
            </Fragment>
        );
    }

    function displaySelectedItems() {
        return (
            <Fragment>
                <h2>Selected Items</h2>
                <p>
                    <span className="label">XM Kb:</span> {Math.round(xmKbs * 100) / 100}{' '}
                    <span className="label">gas:</span> {xmGas} <span className="label">transactions:</span>{' '}
                    {xmTransactionCount}
                </p>
                <p>
                    <span className="label">Sample Kb:</span> {Math.round(sampleKbs * 100) / 100}{' '}
                    <span className="label">gas:</span> {sampleGas} <span className="label">transactions:</span>{' '}
                    {samplesTransactionCount}
                </p>
                <p>
                    <span className="label">Total Kb:</span> {Math.round((xmKbs + sampleKbs) * 100) / 100}
                </p>
                <p>
                    <span className="label">Total Gas:</span> {sampleGas + xmGas}
                </p>
                <p>
                    <span className="label">Total transaction count:</span> {totalTransactionCount}
                </p>
            </Fragment>
        );
    }

    function displayMainView() {
        return (
            <Fragment>
                <DragDropFile onFiles={onFiles}>
                    <p>
                        Drag and drop your <b>XM</b> file here or click to browse
                    </p>
                    <p>
                        Files are currently limited to FastTracker <b>XM</b> modules using <b>8-bit</b> samples
                    </p>
                </DragDropFile>
                {xmFile && showXMInfo(xmFile)}
                {compressedSmpsDict && sampleIDs && (
                    <Fragment>
                        <h2>Samples</h2>
                        <p>Any items with a dark background are too large to upload</p>
                        <SamplesList
                            sampleIDs={sampleIDs}
                            onChainSampleIDs={existingSampleIDs}
                            selectedSampleIDs={selectedSampleIDs}
                            onItemSelectChange={handleItemSelectChange}
                            samplesDict={compressedSmpsDict}
                            maxGas={MAX_GAS_PER_TX}
                        />
                    </Fragment>
                )}

                {sampleIDs.length > 0 &&
                    (existingSampleIDs.length != sampleIDs.length ? (
                        <Fragment>
                            <button onClick={handleSelectAll}>Select All</button>
                            <button onClick={handleDeselectAll}>Deselect All</button>
                        </Fragment>
                    ) : (
                        <p>All samples uploaded</p>
                    ))}
                {(compressedXM || sampleIDs.length > 0) && displaySelectedItems()}

                {selectedSampleIDs.length > 0 && <button onClick={handleUploadSamplesClick}>Upload Samples</button>}
                {compressedXM && xmTransactionCount <= 1 && existingSampleIDs.length == sampleIDs.length && (
                    <button onClick={handleUploadXMClick}>Upload XM</button>
                )}
            </Fragment>
        );
    }

    return (
        <StyledUpload {...otherProps}>
            <h1>Upload</h1>
            {status != 'connected' && <button onClick={handleConnectClick}>Connect</button>}
            {account && <p>Account: {account}</p>}
            {chainId && <p>Chain: {parseInt(chainId, 16)}</p>}
            {status == 'connected' && displayMainView()}
        </StyledUpload>
    );
};
