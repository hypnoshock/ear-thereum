/** @format */

import { DragEvent, ChangeEvent, FunctionComponent, ReactNode } from 'react';
import styled from 'styled-components';
import { ComponentProps } from '@app/types/component-props';
import { styles } from './drag-drop-file.styles';
import React from 'react';

export interface DragDropFileProps extends ComponentProps {
    children?: ReactNode;
    onFiles: (files: FileList) => void;
}

const StyledDragDropFile = styled('div')`
    ${styles}
`;

export const DragDropFile: FunctionComponent<DragDropFileProps> = (props: DragDropFileProps) => {
    const { onFiles } = props;
    const [dragActive, setDragActive] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleDrag = function (e: DragEvent<HTMLFormElement | HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = function (e: DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer && e.dataTransfer.files.length > 0) {
            onFiles(e.dataTransfer.files);
        }
    };

    const handleRefChange = function (e: ChangeEvent<HTMLInputElement>) {
        e.preventDefault();
        if (e.target && e.target.files && e.target.files.length > 0) {
            onFiles(e.target.files);
        }
    };

    const onButtonClick = () => {
        if (inputRef.current) {
            inputRef.current.click();
        }
    };

    return (
        <StyledDragDropFile>
            <form id="form-file-upload" onDragEnter={handleDrag} onSubmit={(e) => e.preventDefault()}>
                <input ref={inputRef} type="file" id="input-file-upload" multiple={true} onChange={handleRefChange} />
                <label id="label-file-upload" htmlFor="input-file-upload" className={dragActive ? 'drag-active' : ''}>
                    <div>
                        <p>Drag and drop your file here or</p>
                        <button className="upload-button" onClick={onButtonClick}>
                            Upload a XM File
                        </button>
                    </div>
                </label>
                {dragActive && (
                    <div
                        id="drag-file-element"
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    ></div>
                )}
            </form>
        </StyledDragDropFile>
    );
};
