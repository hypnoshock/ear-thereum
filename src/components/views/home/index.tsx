/** @format */

import { FunctionComponent, ReactNode } from 'react';
import styled from 'styled-components';
import { ComponentProps } from '@app/types/component-props';
import { styles } from './home.styles';
import { DragDropFile } from '@app/components/molecules/drag-drop-file';

export interface HomeProps extends ComponentProps {
    children?: ReactNode;
}

const StyledHome = styled('div')`
    ${styles}
`;

export const Home: FunctionComponent<HomeProps> = (props: HomeProps) => {
    const { children, ...otherProps } = props;

    return (
        <StyledHome {...otherProps}>
            <h1>Ear-thereum</h1>
            <DragDropFile />
        </StyledHome>
    );
};
