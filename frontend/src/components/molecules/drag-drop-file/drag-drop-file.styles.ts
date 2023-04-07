/** @format */

import { css } from 'styled-components';
import { DragDropFileProps } from './index';

/**
 * Base styles for the drag drop file component
 *
 * @param _ The drag drop file properties object
 * @return Base styles for the drag drop file component
 */
const baseStyles = (_: Partial<DragDropFileProps>) => css`
    width: 60rem;
    height: 30rem;
    max-width: 100%;
    text-align: center;
    position: relative;

    #form-file-upload {
        height: 100%;
    }

    #input-file-upload {
        display: none;
    }

    #label-file-upload {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        border-width: 2px;
        border-radius: 1rem;
        border-style: dashed;
        border-color: #cbd5e1;
        background-color: #f8fafc;
    }

    #label-file-upload.drag-active {
        background-color: #ffffff;
    }

    .upload-button {
        cursor: pointer;
        padding: 0.25rem;
        font-size: 1rem;
        border: none;
        font-family: 'Oswald', sans-serif;
        background-color: transparent;
    }

    .upload-button:hover {
        text-decoration-line: underline;
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
