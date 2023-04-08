/** @format */

import { FunctionComponent, ReactNode } from 'react';
import styled from 'styled-components';
import { ComponentProps } from '@app/types/component-props';
import { styles } from './layout.styles';
import { Header } from '../header';

export interface LayoutProps extends ComponentProps {
    children?: ReactNode;
}

const StyledLayout = styled('div')`
    ${styles}
`;

export const Layout: FunctionComponent<LayoutProps> = (props: LayoutProps) => {
    const { children, ...otherProps } = props;

    return (
        <StyledLayout {...otherProps}>
            <Header />
            <main>{children}</main>
            <div className="player">x</div>
        </StyledLayout>
    );
};
