/** @format */

import { FunctionComponent, useEffect, useState } from 'react';
import styled from 'styled-components';
import { ComponentProps } from '@app/types/component-props';
import { styles } from './xm-viewer.styles';
import { decompressSamples, decompressXM, getXMInfo, reconstructXM, SamplesDict } from '@app/utils/xm-tools';
import { useEarThereumContext } from '@app/contexts/ear-thereum-provider';
import { getBytes } from 'ethers';
import sanitize from 'sanitize-filename';

export interface XmViewerProps extends ComponentProps {
    xmID: string;
}

const StyledXmViewer = styled('div')`
    ${styles}
`;

export const XmViewer: FunctionComponent<XmViewerProps> = (props: XmViewerProps) => {
    const { xmID, ...otherProps } = props;
    const { earThereumContract } = useEarThereumContext();
    // const [loading, setIsLoading] = useState(true);
    // const [hasErrored, setHasErrored] = useState(false);
    const [xmSongData, setXMSongData] = useState<Uint8Array>();
    const [smpsDict, setSmpsDict] = useState<SamplesDict>();
    const [xm, setXM] = useState<Uint8Array>();

    const xmInfo = xmSongData ? getXMInfo(xmSongData) : null;
    const moduleName = xmInfo ? xmInfo.moduleName : '';

    console.log(`Name: '${moduleName}'. hasName: ${moduleName !== ''} len: ${moduleName.length}`);

    useEffect(() => {
        if (earThereumContract && !xmSongData) {
            const fetchXM = async (xmID: string) => {
                const compressedXMStr = await earThereumContract.getXM('0x' + xmID);
                const compressedXM = getBytes(compressedXMStr);
                const xm = decompressXM(compressedXM);
                setXMSongData(xm);
                // const compressedSmpsDict = await fetchSamplesFromChain(sampleIDs);
            };
            fetchXM(xmID);
        }
    }, [earThereumContract, xmSongData, xmID]);

    // Fetch sample data from chain and decompress
    useEffect(() => {
        if (xmInfo && earThereumContract && xmSongData && !smpsDict) {
            const fetchSamples = async (sampleIDs: string[]) => {
                const sampleList = await earThereumContract.getSampleDatas(sampleIDs.map((id) => '0x' + id));
                if (sampleList.length != sampleIDs.length) {
                    throw `Fetched samples list and IDs list length mismatch`;
                }
                const compressedSmpDict = {} as SamplesDict;
                sampleIDs.forEach((sampleID, idx) => {
                    compressedSmpDict[sampleID] = getBytes(sampleList[idx]);
                });

                console.log('SAMPLES:', sampleList);
                console.log(compressedSmpDict);

                const smpsDict = decompressSamples(compressedSmpDict);
                setSmpsDict(smpsDict);
            };
            const { sampleIDs } = xmInfo;
            const uniqueSampleIDs = sampleIDs.filter((sampleID, idx, self) => {
                return self.indexOf(sampleID) === idx;
            });
            fetchSamples(uniqueSampleIDs);
        }
    }, [xmInfo, earThereumContract, xmSongData, smpsDict]);

    // Reconstruct XM file
    useEffect(() => {
        if (xmSongData && smpsDict && !xm) {
            const reconstructedXM = reconstructXM(xmSongData, smpsDict);
            setXM(reconstructedXM);
        }
    }, [xmSongData, smpsDict, xm]);

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

    const handleDownloadClick = () => {
        if (xm && xmInfo) {
            const filename = moduleName ? sanitize(xmInfo.moduleName) + '.xm' : xmID + '.xm';
            downloadFile(xm, filename);
        }
    };

    return (
        <StyledXmViewer {...otherProps}>
            <div>XM ID: {xmID}</div>
            {moduleName && <div>Name: {moduleName}</div>}
            {smpsDict && xm && <button onClick={handleDownloadClick}>download</button>}
        </StyledXmViewer>
    );
};
