/** @format */

import { colors } from '@app/styles/colors';
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
    color: ${isOnChain ? colors.itemText : withinSize ? colors.bodyText : colors.itemText};
    background: ${withinSize ? colors.itemBG : colors.bodyText};
    border: transparent 1px solid;
    border-color: ${withinSize ? 'transparent' : colors.bodyText};
    padding: 1rem;
    border-radius: 1rem;
    min-width: 20rem;
    margin: 0.5rem;

    > .sampleKbs {
        font-weight: bold;
        margin-left: 1rem;
    }

    input[type='checkbox'] {
        accent-color: ${colors.itemText};
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
