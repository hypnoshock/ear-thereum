/** @format */

import { css } from 'styled-components';
import { UploadedSamplesListProps } from './index';

/**
 * Base styles for the uploaded samples list component
 *
 * @param _ The uploaded samples list properties object
 * @return Base styles for the uploaded samples list component
 */
const baseStyles = (_: Partial<UploadedSamplesListProps>) => css``;

/**
 * The uploaded samples list component styles
 *
 * @param props The uploaded samples list properties object
 * @return Styles for the uploaded samples list component
 */
export const styles = (props: Partial<UploadedSamplesListProps>) => css`
    ${baseStyles(props)}
`;
