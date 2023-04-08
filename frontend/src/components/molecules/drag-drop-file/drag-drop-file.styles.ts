/** @format */

import { colors } from '@app/styles/colors';
import { css } from 'styled-components';
import { DragDropFileProps } from './index';

/**
 * Base styles for the drag drop file component
 *
 * @param _ The drag drop file properties object
 * @return Base styles for the drag drop file component
 */
const baseStyles = (_: Partial<DragDropFileProps>) => css`
    width: 100%;
    height: 20rem;
    max-width: 100%;
    text-align: center;
    position: relative;
    color: ${colors.itemText};

    #form-file-upload {
        width: 100%;
        height: 100%;

        border-width: 2px;
        border-radius: 1rem;
        border-style: dashed;
        border-color: ${colors.itemText};
        background-color: #f8fafc;

        display: flex;
        align-items: center;
        justify-content: center;
    }

    #input-file-upload {
        display: none;
    }

    #label-file-upload {
        cursor: pointer;
        width: 100%;
    }

    #label-file-upload:hover {
        text-decoration: underline;
    }

    #label-file-upload.drag-active {
        background-color: #ffffff;
    }

    #drag-file-element {
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 1rem;
        top: 0px;
        right: 0px;
        bottom: 0px;
        left: 0px;
    }
`;

/**
 * The drag drop file component styles
 *
 * @param props The drag drop file properties object
 * @return Styles for the drag drop file component
 */
export const styles = (props: Partial<DragDropFileProps>) => css`
    ${baseStyles(props)}
`;
