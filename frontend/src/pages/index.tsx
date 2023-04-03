/** @format */

import Head from 'next/head';
import { Home } from '@app/components/views/home';

export default function HomePage() {
    return (
        <div>
            <Head>
                <title>Ear-thereum</title>
                <meta property="og:title" content="Ear-thereum" key="title" />
            </Head>
            <Home />
        </div>
    );
}
