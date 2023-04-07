/** @format */

import { css } from 'styled-components';
import { SamplesListItemProps } from './index';

/**
 * Base styles for the samples list item component
 *
 * @param _ The samples list item properties object
 * @return Base styles for the samples list item component
 */
const baseStyles = ({ isOnChain, withinSize }: Partial<SamplesListItemProps>) => css`
    display: flex;
    justify-content: space-between;
    color: ${isOnChain ? `black` : `red`};
    background: ${withinSize ? `#00000070` : `#70000070`};
    padding: 1rem;
    border-radius: 1rem;
    min-width: 14rem;
    margin: 0.1rem;

    > .sampleKbs {
        font-weight: bold;
        margin-left: 1rem;
    }
`;

/**
 * The samples list item component styles
 *
 * @param props The samples list item properties object
 * @return Styles for the samples list item component
 */
export const styles = (props: Partial<SamplesListItemProps>) => css`
    ${baseStyles(props)}
`;
