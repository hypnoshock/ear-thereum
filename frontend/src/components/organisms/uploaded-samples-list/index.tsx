/** @format */

import { FunctionComponent } from 'react';
import styled from 'styled-components';
import { ComponentProps } from '@app/types/component-props';
import { styles } from './uploaded-samples-list.styles';
import { UploadedSamplesListItem } from '@app/components/molecules/uploaded-samples-list-item';

export interface UploadedSamplesListProps extends ComponentProps {
    sampleIDs: string[];
    onSampleClick?: (id: string) => void;
}

const StyledUploadedSamplesList = styled('div')`
    ${styles}
`;

export const UploadedSamplesList: FunctionComponent<UploadedSamplesListProps> = (props: UploadedSamplesListProps) => {
    const { sampleIDs, onSampleClick, ...otherProps } = props;

    return (
        <StyledUploadedSamplesList {...otherProps}>
            {sampleIDs.map((sampleID) => {
                return <UploadedSamplesListItem key={sampleID} sampleID={sampleID} onClick={onSampleClick} />;
            })}
            {sampleIDs.length == 0 && <p>No samples uploaded yet</p>}
        </StyledUploadedSamplesList>
    );
};
