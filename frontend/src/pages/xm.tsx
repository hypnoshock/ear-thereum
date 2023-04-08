/** @format */

import { XmViewer } from '@app/components/atoms/xm-viewer';
import { useRouter } from 'next/router';

const XmPage = () => {
    const { query } = useRouter();
    const xmID = query.id?.toString().replace('0x', '').toLowerCase() || '';

    // Check it's a hex
    // Check it's 4 bytes

    return <div>{xmID && <XmViewer xmID={xmID} />}</div>;
};

export default XmPage;
