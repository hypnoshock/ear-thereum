/** @format */

import { Fragment } from 'react';
import Head from 'next/head';
import { GlobalStyles } from '@app/styles/global.styles';
import { MetaMaskProvider } from 'metamask-react';
import { EarThereumProvider } from '@app/contexts/ear-thereum-provider';
import { XMPlayerProvider } from '@app/contexts/xm-player-provider';

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
                <XMPlayerProvider>
                    <EarThereumProvider>
                        <Component {...pageProps} />
                    </EarThereumProvider>
                </XMPlayerProvider>
            </MetaMaskProvider>
        </Fragment>
    );
}

export default App;
