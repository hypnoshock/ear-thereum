/** @format */

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { createPlayer } from '@app/player/xm';
import { XMEffects } from '@app/player/xmeffects';

export interface XMPlayerContextProviderProps {
    children?: ReactNode;
}

export interface XMPlayerContextStore {
    xmPlayer: any;
}

export const XMPlayerContext = createContext<XMPlayerContextStore>({} as XMPlayerContextStore);

export const useXMPlayerContext = () => useContext(XMPlayerContext);

export const XMPlayerProvider = ({ children }: XMPlayerContextProviderProps) => {
    const [xmPlayer, setXMPlayer] = useState<any>();
    const [isInitialised, setIsInitialised] = useState(false);
    const store: XMPlayerContextStore = {
        xmPlayer
    };

    useEffect(() => {
        if (!xmPlayer) {
            const xmPlayer = XMEffects(createPlayer());
            setXMPlayer(xmPlayer);
        }
    }, [xmPlayer]);

    useEffect(() => {
        if (xmPlayer && !isInitialised) {
            console.log('XMPlayerProvider:: Initialising player');
            xmPlayer.init();
            setIsInitialised(true);
            console.log('XMPlayerProvider:: xmPlayer', xmPlayer);
        }
    }, [xmPlayer, isInitialised]);

    return <XMPlayerContext.Provider value={store}>{children}</XMPlayerContext.Provider>;
};
