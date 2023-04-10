/** @format */

import { FunctionComponent } from 'react';
import styled from 'styled-components';
import { ComponentProps } from '@app/types/component-props';
import { styles } from './tune.styles';

export interface TuneProps extends ComponentProps {
    name: string;
    uploader: string;
    tuneID: string;
    onClick?: (id: string) => void;
}

const StyledTune = styled('div')`
    ${styles}
`;

export const Tune: FunctionComponent<TuneProps> = (props: TuneProps) => {
    const { name, tuneID, uploader, onClick, ...otherProps } = props;

    const handleClick = () => {
        if (onClick) {
            onClick(tuneID);
        }
    };

    return (
        <StyledTune {...otherProps} onClick={handleClick}>
            <div className="name">{name}</div>
            <div className="uploader">{uploader}</div>
            <div className="tuneID">{tuneID}</div>
        </StyledTune>
    );
};
