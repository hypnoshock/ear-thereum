/** @format */

import { FunctionComponent, ReactNode } from 'react';
import styled from 'styled-components';
import { ComponentProps } from '@app/types/component-props';
import { styles } from './samples-list.styles';
import { SamplesListItem } from '../samples-list-item';

export interface SamplesListProps extends ComponentProps {
    sampleIDs: string[];
    onChainSampleIDs: string[];
    selectedSampleIDs: string[];
    onItemSelectChange?: (sampleID: string, isChecked: boolean) => void;
}

const StyledSamplesList = styled('div')`
    ${styles}
`;

export const SamplesList: FunctionComponent<SamplesListProps> = (props: SamplesListProps) => {
    const { sampleIDs, onChainSampleIDs, selectedSampleIDs, onItemSelectChange, ...otherProps } = props;

    return (
        <StyledSamplesList {...otherProps}>
            {sampleIDs.map((sampleID, idx) => {
                const isOnChain = onChainSampleIDs.includes(sampleID);
                const isSelected = selectedSampleIDs.includes(sampleID);
                return (
                    <SamplesListItem
                        key={idx}
                        sampleID={sampleID}
                        isOnChain={isOnChain}
                        isSelected={isSelected}
                        onChange={onItemSelectChange}
                    />
                );
            })}
        </StyledSamplesList>
    );
};
