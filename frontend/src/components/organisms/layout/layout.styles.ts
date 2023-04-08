/** @format */

import { colors } from '@app/styles/colors';
import { css } from 'styled-components';
import { LayoutProps } from './index';

/**
 * Base styles for the layout component
 *
 * @param _ The layout properties object
 * @return Base styles for the layout component
 */
const baseStyles = (_: Partial<LayoutProps>) => css`
    width: 100%;
    position: relative;
    /* background: blue; */

    main {
        display: flex;
        justify-content: center;
        padding: 1rem 1rem calc(30px + 1rem) 1rem;
    }

    main > div {
        width: 1024px;
        max-width: 1920px;
        /* background: red; */
    }

    .player {
        position: fixed;
        /* height: 1rem; */
        width: 100%;
        bottom: 0;
        height: 30px;
        background: ${colors.itemBG};
    }
`;

/**
 * The layout component styles
 *
 * @param props The layout properties object
 * @return Styles for the layout component
 */
export const styles = (props: Partial<LayoutProps>) => css`
    ${baseStyles(props)}
`;
