/** @format */

import { colors } from '@app/styles/colors';
import { css } from 'styled-components';
import { UploadProps } from './index';

/**
 * Base styles for the upload component
 *
 * @param _ The upload properties object
 * @return Base styles for the upload component
 */
const baseStyles = (_: Partial<UploadProps>) => css`
    .label {
        font-weight: bold;
        color: ${colors.itemText};
    }
`;

/**
 * The upload component styles
 *
 * @param props The upload properties object
 * @return Styles for the upload component
 */
export const styles = (props: Partial<UploadProps>) => css`
    ${baseStyles(props)}
`;
