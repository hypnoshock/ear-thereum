/** @format */

import { Fragment } from 'react';
import Head from 'next/head';
import { GlobalStyles } from '@app/styles/global.styles';
import { MetaMaskProvider } from 'metamask-react';
import { EarThereumProvider } from '@app/contexts/ear-thereum-provider';

function App({ Component, pageProps }: any) {
    return (
        <Fragment>
            <Head>
                <title>Immutatune</title>
                <meta name="description" content="Immutatune music collaboration platform" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <GlobalStyles />
            <MetaMaskProvider>
                <EarThereumProvider>
                    <Component {...pageProps} />
                </EarThereumProvider>
            </MetaMaskProvider>
        </Fragment>
    );
}

export default App;
