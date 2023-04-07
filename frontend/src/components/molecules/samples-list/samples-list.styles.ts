/** @format */

import { css } from 'styled-components';
import { SamplesListProps } from './index';

/**
 * Base styles for the samples list component
 *
 * @param _ The samples list properties object
 * @return Base styles for the samples list component
 */
const baseStyles = (_: Partial<SamplesListProps>) => css`
    display: flex;
    flex-wrap: wrap;
`;

/**
 * The samples list component styles
 *
 * @param props The samples list properties object
 * @return Styles for the samples list component
 */
export const styles = (props: Partial<SamplesListProps>) => css`
    ${baseStyles(props)}
`;
