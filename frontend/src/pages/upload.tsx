/** @format */

import { Layout } from '@app/components/organisms/layout';
import { Upload } from '@app/components/views/upload';
import Head from 'next/head';

const UploadPage = () => {
    return (
        <div>
            <Head>
                <title>Immutatune: Upload</title>
                <meta property="og:title" content="Immutatune: Upload" key="title" />
            </Head>
            <Layout>
                <Upload />
            </Layout>
        </div>
    );
};

export default UploadPage;
