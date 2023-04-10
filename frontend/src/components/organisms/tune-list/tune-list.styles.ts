/** @format */

import { css } from 'styled-components';
import { TuneListProps } from './index';

/**
 * Base styles for the tune list component
 *
 * @param _ The tune list properties object
 * @return Base styles for the tune list component
 */
const baseStyles = (_: Partial<TuneListProps>) => css`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-gap: 1rem;
`;

/**
 * The tune list component styles
 *
 * @param props The tune list properties object
 * @return Styles for the tune list component
 */
export const styles = (props: Partial<TuneListProps>) => css`
    ${baseStyles(props)}
`;
