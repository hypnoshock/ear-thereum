/** @format */

import { FunctionComponent, ReactNode } from 'react';
import styled from 'styled-components';
import { ComponentProps } from '@app/types/component-props';
import { styles } from './tune-list.styles';
import { Tune } from '@app/components/atoms/tune';

export interface TuneListProps extends ComponentProps {}

const StyledTuneList = styled('div')`
    ${styles}
`;

export const TuneList: FunctionComponent<TuneListProps> = (props: TuneListProps) => {
    const { ...otherProps } = props;

    return (
        <StyledTuneList {...otherProps}>
            <Tune name="Tune name 1" uploader="0xDeee4887A6f90c1F08Be2151A3aa23D05bA4C545" tuneID="47ef36bc" />
            <Tune name="Tune name 2" uploader="0xDeee4887A6f90c1F08Be2151A3aa23D05bA4C545" tuneID="47ef36bc" />
            <Tune name="Tune name 3" uploader="0xDeee4887A6f90c1F08Be2151A3aa23D05bA4C545" tuneID="47ef36bc" />
            <Tune name="Tune name 4" uploader="0xDeee4887A6f90c1F08Be2151A3aa23D05bA4C545" tuneID="47ef36bc" />
            <Tune name="Tune name 5" uploader="0xDeee4887A6f90c1F08Be2151A3aa23D05bA4C545" tuneID="47ef36bc" />
            <Tune name="Tune name 6" uploader="0xDeee4887A6f90c1F08Be2151A3aa23D05bA4C545" tuneID="47ef36bc" />
            <Tune name="Tune name 7" uploader="0xDeee4887A6f90c1F08Be2151A3aa23D05bA4C545" tuneID="47ef36bc" />
            <Tune name="Tune name 8" uploader="0xDeee4887A6f90c1F08Be2151A3aa23D05bA4C545" tuneID="47ef36bc" />
        </StyledTuneList>
    );
};
