/** @format */

import { ChangeEvent, FunctionComponent, ReactNode, useState } from 'react';
import styled from 'styled-components';
import { ComponentProps } from '@app/types/component-props';
import { styles } from './samples-list-item.styles';

export interface SamplesListItemProps extends ComponentProps {
    sampleID: string;
    isOnChain: boolean;
    onChange?: (sampleID: string, isChecked: boolean) => void;
}

const StyledSamplesListItem = styled('div')`
    ${styles}
`;

export const SamplesListItem: FunctionComponent<SamplesListItemProps> = (props: SamplesListItemProps) => {
    const { sampleID, onChange, ...otherProps } = props;
    const [isChecked, setIsChecked] = useState(true);

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
        setIsChecked(e.target.checked);
        if (onChange) {
            onChange(sampleID, e.target.checked);
        }
    }

    return (
        <StyledSamplesListItem {...otherProps}>
            <div className="sampleID">Sample ID: {sampleID}</div>
            <input type="checkbox" checked={isChecked} onChange={handleChange} />
        </StyledSamplesListItem>
    );
};
