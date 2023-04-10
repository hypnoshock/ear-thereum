/** @format */

import { FunctionComponent } from 'react';
import styled from 'styled-components';
import { ComponentProps } from '@app/types/component-props';
import { styles } from './uploaded-samples-list-item.styles';

export interface UploadedSamplesListItemProps extends ComponentProps {
    sampleID: string;
    onClick?: (id: string) => void;
}

const StyledUploadedSamplesListItem = styled('div')`
    ${styles}
`;

export const UploadedSamplesListItem: FunctionComponent<UploadedSamplesListItemProps> = (
    props: UploadedSamplesListItemProps
) => {
    const { sampleID, onClick, ...otherProps } = props;

    const handleClick = () => {
        if (onClick) {
            onClick(sampleID);
        }
    };

    return (
        <StyledUploadedSamplesListItem {...otherProps} onClick={handleClick}>
            <div className="sampleID">{sampleID}</div>
        </StyledUploadedSamplesListItem>
    );
};
