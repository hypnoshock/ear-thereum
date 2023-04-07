/** @format */

import { FunctionComponent } from 'react';
import styled from 'styled-components';
import { ComponentProps } from '@app/types/component-props';
import { styles } from './samples-list.styles';
import { SamplesListItem } from '../samples-list-item';
import { SamplesDict } from '@app/utils/xm-tools';
import { getGasEstimate } from '@app/helpers/GasHelper';
import { getSampleKbs } from '@app/helpers/SampleHelper';

export interface SamplesListProps extends ComponentProps {
    sampleIDs: string[];
    onChainSampleIDs: string[];
    selectedSampleIDs: string[];
    samplesDict: SamplesDict;
    maxGas: number;
    onItemSelectChange?: (sampleID: string, isChecked: boolean) => void;
}

const StyledSamplesList = styled('div')`
    ${styles}
`;

export const SamplesList: FunctionComponent<SamplesListProps> = (props: SamplesListProps) => {
    const { sampleIDs, onChainSampleIDs, selectedSampleIDs, samplesDict, maxGas, onItemSelectChange, ...otherProps } =
        props;

    return (
        <StyledSamplesList {...otherProps}>
            {sampleIDs.map((sampleID, idx) => {
                const isOnChain = onChainSampleIDs.includes(sampleID);
                const isSelected = selectedSampleIDs.includes(sampleID);
                const sampleData = samplesDict[sampleID];
                const smpKbs = getSampleKbs(sampleData);
                const withinSize = getGasEstimate(smpKbs) < maxGas;
                return (
                    <SamplesListItem
                        key={idx}
                        sampleID={sampleID}
                        isOnChain={isOnChain}
                        isSelected={isSelected}
                        smpKbs={smpKbs}
                        withinSize={withinSize}
                        onChange={onItemSelectChange}
                    />
                );
            })}
        </StyledSamplesList>
    );
};
