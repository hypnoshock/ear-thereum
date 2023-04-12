/** @format */

import { FunctionComponent } from 'react';
import styled from 'styled-components';
import { ComponentProps } from '@app/types/component-props';
import { styles } from './home.styles';
import { TuneList } from '@app/components/organisms/tune-list';
import { useEarThereumContext } from '@app/contexts/ear-thereum-provider';
import { useRouter } from 'next/router';
import { UploadedSamplesList } from '@app/components/organisms/uploaded-samples-list';

export interface HomeProps extends ComponentProps {}

const StyledHome = styled('div')`
    ${styles}
`;

export const Home: FunctionComponent<HomeProps> = (props: HomeProps) => {
    const { ...otherProps } = props;
    const { uploadedTunes, uploadedSamples } = useEarThereumContext();
    const router = useRouter();

    const handleTuneClick = (tuneID: string) => {
        router.push(`/xm?id=${tuneID}`);
    };

    const handleSampleClick = (tuneID: string) => {
        console.log(tuneID);
        // router.push(`/sample?id=${tuneID}`);
    };

    return (
        <StyledHome {...otherProps}>
            <section id="latest-tunes">
                <h1>Latest Tunes</h1>
                <TuneList tuneIDs={uploadedTunes} onTuneClick={handleTuneClick} />
                <h1>Latest Samples</h1>
                <UploadedSamplesList sampleIDs={uploadedSamples} onSampleClick={handleSampleClick} />
            </section>
        </StyledHome>
    );
};
