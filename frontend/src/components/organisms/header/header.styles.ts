/** @format */

import { colors } from '@app/styles/colors';
import { css } from 'styled-components';
import { HeaderProps } from './index';

/**
 * Base styles for the header component
 *
 * @param _ The header properties object
 * @return Base styles for the header component
 */
const baseStyles = (_: Partial<HeaderProps>) => css`
    position: relative;

    .menu {
        position: sticky;
        top: 1rem;
        text-align: center;
        font-size: 2.5rem;
    }

    a {
        color: ${colors.itemText};
        font-weight: bold;
        text-decoration: none;
        margin: 0 1rem;
    }

    a.current {
        color: ${colors.bodyText};
    }

    a:hover {
        text-decoration: underline;
    }
`;

/**
 * The header component styles
 *
 * @param props The header properties object
 * @return Styles for the header component
 */
export const styles = (props: Partial<HeaderProps>) => css`
    ${baseStyles(props)}
`;
