/** @format */

import { EarThereum, EarThereum__factory } from '@app/services/contracts';
import { ethers, Signer } from 'ethers';
import { useMetaMask } from 'metamask-react';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export interface EarThereumContextProviderProps {
    children?: ReactNode;
}

export interface EarThereumContextStore {
    count: number;
    earThereumContract: EarThereum | null;
    incCount: () => Promise<void>;
}

export const EarThereumContext = createContext<EarThereumContextStore>({} as EarThereumContextStore);

export const useEarThereumContext = () => useContext(EarThereumContext);

export const EarThereumProvider = ({ children }: EarThereumContextProviderProps) => {
    const { status, ethereum, chainId } = useMetaMask();
    const [earThereumContract, setEarThereumContract] = useState<EarThereum | null>(null);
    const [signer, setSigner] = useState<Signer | null>(null);
    const [count, setCount] = useState(-1);

    // Instantiate contract when provider ready
    useEffect(() => {
        if (signer) {
            const earThereumContract = EarThereum__factory.connect(
                '0x2804EaDB5821DebF21A30B70673eD3e1dDE3E5Cd',
                signer
            );
            setEarThereumContract(earThereumContract);
        }
    }, [signer]);

    // Instantiate provider when MetaMask is connected
    useEffect(() => {
        if (status == 'connected' && ethereum) {
            const chainIdNum = parseInt(chainId, 16);
            // Only works on local test
            if (chainIdNum == 31337) {
                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                setSigner(signer);
            } else {
                setSigner(null);
            }
        }
    }, [status, ethereum, chainId]);

    const getCount = async (earThereumContract: EarThereum) => {
        const count = await earThereumContract.getCounter();
        setCount(count.toNumber());
    };

    const incCount = async () => {
        if (earThereumContract) {
            await (await earThereumContract.incCounter()).wait();
            await getCount(earThereumContract);
        }
    };

    useEffect(() => {
        if (earThereumContract && signer) {
            getCount(earThereumContract);
        } else {
            setCount(-1);
        }
    }, [earThereumContract, signer]);

    const store: EarThereumContextStore = {
        count,
        earThereumContract,
        incCount
    };

    return <EarThereumContext.Provider value={store}>{children}</EarThereumContext.Provider>;
};
