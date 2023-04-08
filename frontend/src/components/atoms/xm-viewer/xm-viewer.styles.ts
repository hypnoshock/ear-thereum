/** @format */

import { css } from 'styled-components';
import { XmViewerProps } from './index';

/**
 * Base styles for the xm viewer component
 *
 * @param _ The xm viewer properties object
 * @return Base styles for the xm viewer component
 */
const baseStyles = (_: Partial<XmViewerProps>) => css``;

/**
 * The xm viewer component styles
 *
 * @param props The xm viewer properties object
 * @return Styles for the xm viewer component
 */
export const styles = (props: Partial<XmViewerProps>) => css`
    ${baseStyles(props)}
`;
