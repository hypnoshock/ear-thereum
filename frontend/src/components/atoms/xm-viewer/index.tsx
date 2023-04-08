/** @format */

import { FunctionComponent, useEffect, useState } from 'react';
import styled from 'styled-components';
import { ComponentProps } from '@app/types/component-props';
import { styles } from './xm-viewer.styles';
import {
    compressSamples,
    compressXM,
    decompressSamples,
    decompressXM,
    getID,
    getXMInfo,
    reconstructXM,
    SamplesDict,
    setSampleIDsInXM,
    stripXM
} from '@app/utils/xm-tools';
import { useEarThereumContext } from '@app/contexts/ear-thereum-provider';
import { getBytes } from 'ethers';
import { SamplesList } from '@app/components/molecules/samples-list';
import sanitize from 'sanitize-filename';

export interface XmViewerProps extends ComponentProps {
    xmID: string;
}

const StyledXmViewer = styled('div')`
    ${styles}
`;

export const XmViewer: FunctionComponent<XmViewerProps> = (props: XmViewerProps) => {
    const { xmID, ...otherProps } = props;
    const { earThereumContract, getExistingSampleIDs, convertIDsToBytes4 } = useEarThereumContext();
    const [loading, setIsLoading] = useState(true);
    const [hasErrored, setHasErrored] = useState(false);
    const [xmSongData, setXMSongData] = useState<Uint8Array>();
    const [smpsDict, setSmpsDict] = useState<SamplesDict>();
    const [xm, setXM] = useState<Uint8Array>();

    const xmInfo = xmSongData ? getXMInfo(xmSongData) : null;

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
            // TODO: Filter to unique ones!
            fetchSamples(sampleIDs);
        }
    }, [xmInfo, earThereumContract, xmSongData, smpsDict]);

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
            const filename = xmInfo.moduleName ? sanitize(xmInfo.moduleName) + '.xm' : xmID + '.xm';
            downloadFile(xm, filename);
        }
    };

    return (
        <StyledXmViewer {...otherProps}>
            <div>XM ID: {xmID}</div>
            {xmInfo && <div>{xmInfo.moduleName}</div>}
            {smpsDict && xm && <button onClick={handleDownloadClick}>download</button>}
        </StyledXmViewer>
    );
};
