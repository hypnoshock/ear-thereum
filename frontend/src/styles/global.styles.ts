/** @format */

import { createGlobalStyle } from 'styled-components';
import { resetStyles } from './reset.styles';
import { colors } from './colors';

export const GlobalStyles = createGlobalStyle`
    ${resetStyles}

    @font-face {
        font-family: 'Rubik Pixels';
        src: url('fonts/subset-RubikPixels-Regular.woff2') format('woff2'),
            url('fonts/subset-RubikPixels-Regular.woff') format('woff');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
    }

    @font-face {
        font-family: 'Titillium Web';
        src: url('fonts/TitilliumWeb-Regular.woff2') format('woff2'),
            url('fonts/TitilliumWeb-Regular.woff') format('woff');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
    }

    @font-face {
        font-family: 'Titillium Web';
        src: url('fonts/TitilliumWeb-Bold.woff2') format('woff2'),
            url('fonts/TitilliumWeb-Bold.woff') format('woff');
        font-weight: bold;
        font-style: normal;
        font-display: swap;
    }

    body {
        font-family: 'Titillium Web', Arial, Helvetica, sans-serif;
        font-size: 1.5rem;
        
        background: url('background.png');
        background-attachment: fixed;
        background-size: cover;
        color: ${colors.bodyText};
    }

    h1 {
        /* font-family: 'Titillium Web'; */
        /* font-weight: bold; */
        font-size: 4rem;
    }

    .logo-text {
        font-family: 'Rubik Pixels';
        font-size: 12rem;
        text-align: center;
        color: ${colors.title};
        line-height: 10rem;
    }

`;
