/** @format */

import { FunctionComponent } from 'react';
import styled from 'styled-components';
import { ComponentProps } from '@app/types/component-props';
import { styles } from './tune-list.styles';
import { Tune } from '@app/components/atoms/tune';

export interface TuneListProps extends ComponentProps {
    tuneIDs: string[]; // Essentially xmIDs but generically calling them 'tunes' as I'll implement .mod files soon
    onTuneClick?: (id: string) => void;
}

const StyledTuneList = styled('div')`
    ${styles}
`;

export const TuneList: FunctionComponent<TuneListProps> = (props: TuneListProps) => {
    const { tuneIDs, onTuneClick, ...otherProps } = props;

    return (
        <StyledTuneList {...otherProps}>
            {tuneIDs.map((tuneID, idx) => {
                return (
                    <Tune key={tuneID} name={'Tune name ' + idx} uploader="0x0" tuneID={tuneID} onClick={onTuneClick} />
                );
            })}
            {tuneIDs.length == 0 && <p>No tunes uploaded yet</p>}
        </StyledTuneList>
    );
};
