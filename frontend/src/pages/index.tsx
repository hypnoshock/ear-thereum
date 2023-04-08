/** @format */

import Head from 'next/head';
import { Home } from '@app/components/views/home';
import { Layout } from '@app/components/organisms/layout';

export default function HomePage() {
    return (
        <div>
            <Head>
                <title>Immutatune</title>
                <meta property="og:title" content="Immutatune" key="title" />
            </Head>
            <Layout>
                <Home />
            </Layout>
        </div>
    );
}
