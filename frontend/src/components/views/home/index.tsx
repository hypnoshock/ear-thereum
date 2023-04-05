/** @format */

import { FunctionComponent, ReactNode } from 'react';
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
    setSampleIDsInXM,
    stripXM
} from '@app/utils/xm-tools';
export interface HomeProps extends ComponentProps {
    children?: ReactNode;
}

const StyledHome = styled('div')`
    ${styles}
`;

export const Home: FunctionComponent<HomeProps> = (props: HomeProps) => {
    const { children, ...otherProps } = props;

    const onFiles = (files: FileList) => {
        if (files.length > 0) {
            files[0].arrayBuffer().then((xmBytes) => {
                const { strippedXM, samples } = stripXM(new Uint8Array(xmBytes));
                console.log('stripped XM size: ', strippedXM.length);
                console.log(
                    'sample data dize: ',
                    samples.reduce((acc, elm) => acc + elm.length, 0)
                );

                const { compressedSmpsDict, sampleIDs } = compressSamples(samples);
                console.log(
                    'compressed sample data dize: ',
                    sampleIDs.reduce((acc, id) => acc + compressedSmpsDict[id].length, 0)
                );
                // writeSamples(compressedSmpsDict);

                setSampleIDsInXM(strippedXM, sampleIDs);

                const compressedXM = compressXM(strippedXM);
                console.log('compressed XM size: ', compressedXM.length);

                // -- Reconstruct
                const decompressedXM = decompressXM(compressedXM);

                const { sampleIDs: fetchedSampleIDs } = getXMInfo(decompressedXM);
                const fetchedSmpsDict = fetchSamples(fetchedSampleIDs); // TODO: Fetch from blockchain
                const decompressedSmpsDict = decompressSamples(compressedSmpsDict);
                const reconstructedXM = reconstructXM(decompressedXM, decompressedSmpsDict);

                // downloadFile(reconstructedXM, 'reconstructed.xm');
            });
        }
    };

    // Fetch sample data from blockchain
    const fetchSamples = (sampleIDs: string[]) => {
        return null; // not implemented
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

    return (
        <StyledHome {...otherProps}>
            <h1>Ear-thereum</h1>
            <DragDropFile onFiles={onFiles} />
        </StyledHome>
    );
};
