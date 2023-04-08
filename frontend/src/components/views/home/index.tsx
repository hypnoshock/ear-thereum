/** @format */

import { FunctionComponent } from 'react';
import styled from 'styled-components';
import { ComponentProps } from '@app/types/component-props';
import { styles } from './home.styles';
import { TuneList } from '@app/components/organisms/tune-list';

export interface HomeProps extends ComponentProps {}

const StyledHome = styled('div')`
    ${styles}
`;

export const Home: FunctionComponent<HomeProps> = (props: HomeProps) => {
    const { ...otherProps } = props;

    return (
        <StyledHome {...otherProps}>
            <section id="latest-tunes">
                <h1>Latest Tunes</h1>
                <TuneList />
            </section>
        </StyledHome>
    );
};
