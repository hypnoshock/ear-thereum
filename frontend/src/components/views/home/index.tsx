/** @format */

import { FunctionComponent } from 'react';
import styled from 'styled-components';
import { ComponentProps } from '@app/types/component-props';
import { styles } from './home.styles';
import { TuneList } from '@app/components/organisms/tune-list';
import { useEarThereumContext } from '@app/contexts/ear-thereum-provider';
import { useRouter } from 'next/router';

export interface HomeProps extends ComponentProps {}

const StyledHome = styled('div')`
    ${styles}
`;

export const Home: FunctionComponent<HomeProps> = (props: HomeProps) => {
    const { ...otherProps } = props;
    const { uploadedTunes } = useEarThereumContext();
    const router = useRouter();

    const handleTuneClick = (tuneID: string) => {
        console.log(tuneID);

        router.push(`/xm?id=${tuneID}`);
    };

    return (
        <StyledHome {...otherProps}>
            <section id="latest-tunes">
                <h1>Latest Tunes</h1>
                <TuneList tuneIDs={uploadedTunes} onTuneClick={handleTuneClick} />
            </section>
        </StyledHome>
    );
};
