/** @format */

import { FunctionComponent, ReactNode } from 'react';
import styled from 'styled-components';
import { ComponentProps } from '@app/types/component-props';
import { styles } from './tune.styles';

export interface TuneProps extends ComponentProps {
    name: string;
    uploader: string;
    tuneID: string;
}

const StyledTune = styled('div')`
    ${styles}
`;

export const Tune: FunctionComponent<TuneProps> = (props: TuneProps) => {
    const { name, tuneID, uploader, ...otherProps } = props;

    return (
        <StyledTune {...otherProps}>
            <div className="name">{name}</div>
            <div className="uploader">{uploader}</div>
            <div className="tuneID">{tuneID}</div>
        </StyledTune>
    );
};
