/** @format */

import { XmViewer } from '@app/components/atoms/xm-viewer';
import { Layout } from '@app/components/organisms/layout';
import Head from 'next/head';
import { useRouter } from 'next/router';

const XmPage = () => {
    const { query } = useRouter();
    const xmID = query.id?.toString().replace('0x', '').toLowerCase() || '';

    // Check it's a hex
    // Check it's 4 bytes

    return (
        <div>
            <Head>
                <title>Immutatune: XM Viewer</title>
                <meta property="og:title" content="Immutatune: XM Viewer" key="title" />
            </Head>
            <Layout>{xmID && <XmViewer xmID={xmID} />}</Layout>
        </div>
    );
};

export default XmPage;
