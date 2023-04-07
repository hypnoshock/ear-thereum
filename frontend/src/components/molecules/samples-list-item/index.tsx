/** @format */

import { ChangeEvent, FunctionComponent, ReactNode, useState } from 'react';
import styled from 'styled-components';
import { ComponentProps } from '@app/types/component-props';
import { styles } from './samples-list-item.styles';

export interface SamplesListItemProps extends ComponentProps {
    sampleID: string;
    isOnChain: boolean;
    isSelected: boolean;
    onChange?: (sampleID: string, isChecked: boolean) => void;
}

const StyledSamplesListItem = styled('div')`
    ${styles}
`;

export const SamplesListItem: FunctionComponent<SamplesListItemProps> = (props: SamplesListItemProps) => {
    const { sampleID, isOnChain, onChange, isSelected, ...otherProps } = props;
    function handleChange(e: ChangeEvent<HTMLInputElement>) {
        if (onChange) {
            onChange(sampleID, e.target.checked);
        }
    }

    return (
        <StyledSamplesListItem {...{ isOnChain, ...otherProps }}>
            <div className="sampleID">Sample ID: {sampleID}</div>
            {!isOnChain && <input type="checkbox" checked={isSelected} onChange={handleChange} />}
        </StyledSamplesListItem>
    );
};
