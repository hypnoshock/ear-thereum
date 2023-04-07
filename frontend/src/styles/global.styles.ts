/** @format */

import { createGlobalStyle } from 'styled-components';
import { resetStyles } from './reset.styles';

export const GlobalStyles = createGlobalStyle`
    ${resetStyles}

    font-family: Arial, Helvetica, sans-serif;

    background: sandybrown;
`;
