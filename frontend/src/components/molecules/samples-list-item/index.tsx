/** @format */

import { ChangeEvent, FunctionComponent } from 'react';
import styled from 'styled-components';
import { ComponentProps } from '@app/types/component-props';
import { styles } from './samples-list-item.styles';

export interface SamplesListItemProps extends ComponentProps {
    sampleID: string;
    isOnChain: boolean;
    isSelected: boolean;
    withinSize: boolean;
    smpKbs: number;
    onChange?: (sampleID: string, isChecked: boolean) => void;
}

const StyledSamplesListItem = styled('div')`
    ${styles}
`;

export const SamplesListItem: FunctionComponent<SamplesListItemProps> = (props: SamplesListItemProps) => {
    const { sampleID, smpKbs, isOnChain, withinSize, isSelected, onChange, ...otherProps } = props;
    function handleChange(e: ChangeEvent<HTMLInputElement>) {
        if (onChange) {
            onChange(sampleID, e.target.checked);
        }
    }

    return (
        <StyledSamplesListItem {...{ isOnChain, withinSize, ...otherProps }}>
            <div className="sampleID">ID: {sampleID}</div>
            <div className="sampleKbs">{smpKbs}kb</div>
            {!isOnChain && <input type="checkbox" checked={isSelected} onChange={handleChange} />}
        </StyledSamplesListItem>
    );
};
