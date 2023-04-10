/** @format */

import { css } from 'styled-components';
import { UploadedSamplesListItemProps } from './index';

/**
 * Base styles for the uploaded samples list item component
 *
 * @param _ The uploaded samples list item properties object
 * @return Base styles for the uploaded samples list item component
 */
const baseStyles = (_: Partial<UploadedSamplesListItemProps>) => css``;

/**
 * The uploaded samples list item component styles
 *
 * @param props The uploaded samples list item properties object
 * @return Styles for the uploaded samples list item component
 */
export const styles = (props: Partial<UploadedSamplesListItemProps>) => css`
    ${baseStyles(props)}
`;
