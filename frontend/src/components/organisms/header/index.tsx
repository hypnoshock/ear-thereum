/** @format */

import { FunctionComponent, ReactNode } from 'react';
import styled from 'styled-components';
import { ComponentProps } from '@app/types/component-props';
import { styles } from './header.styles';
import Link from 'next/link';
import { useRouter } from 'next/router';

export interface HeaderProps extends ComponentProps {}

const StyledHeader = styled('div')`
    ${styles}
`;

export const Header: FunctionComponent<HeaderProps> = (props: HeaderProps) => {
    const { ...otherProps } = props;
    const router = useRouter();
    const path = router.pathname;

    // TODO: That Link className is pretty nasty!

    return (
        <StyledHeader {...otherProps}>
            <div className="logo-text">immutatune</div>
            <div className="menu">
                <Link href="/">
                    <a className={path == '/' ? 'current' : ''}>Home</a>
                </Link>
                <Link href="/upload">
                    <a className={path == '/upload' ? 'current' : ''}>Upload</a>
                </Link>
                <Link href="/">
                    <a className={path == '/about' ? 'current' : ''}>About</a>
                </Link>
            </div>
        </StyledHeader>
    );
};
