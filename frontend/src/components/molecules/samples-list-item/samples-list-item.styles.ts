/** @format */

import { css } from 'styled-components';
import { SamplesListItemProps } from './index';

/**
 * Base styles for the samples list item component
 *
 * @param _ The samples list item properties object
 * @return Base styles for the samples list item component
 */
const baseStyles = ({ isOnChain }: Partial<SamplesListItemProps>) => css`
    display: flex;
    justify-content: space-between;
    color: ${isOnChain ? `black` : `red`};
    background: #00000070;
    padding: 1rem;
    border-radius: 1rem;
    min-width: 14rem;
    margin: 0.1rem;
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
