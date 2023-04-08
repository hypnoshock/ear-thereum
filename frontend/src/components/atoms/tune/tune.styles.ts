/** @format */

import { css } from 'styled-components';
import { TuneProps } from './index';
import { colors } from '@app/styles/colors';

/**
 * Base styles for the tune component
 *
 * @param _ The tune properties object
 * @return Base styles for the tune component
 */
const baseStyles = (_: Partial<TuneProps>) => css`
    background-color: ${colors.itemBG};
    color: ${colors.itemText};
    border-radius: 2rem;
    padding: 1rem;
    margin: 0.5rem;

    /* border-style: solid;
    border-width: 1px;
    border-color: ${colors.itemText}; */

    flex-grow: 1;

    > .name {
        font-weight: bold;
    }

    :hover {
        background-color: ${colors.itemBGOver};
    }
`;

/**
 * The tune component styles
 *
 * @param props The tune properties object
 * @return Styles for the tune component
 */
export const styles = (props: Partial<TuneProps>) => css`
    ${baseStyles(props)}

    transition: background-color 0.4s;
`;
