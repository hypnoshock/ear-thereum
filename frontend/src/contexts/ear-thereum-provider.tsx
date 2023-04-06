/** @format */

import { EarThereum, EarThereum__factory } from '@app/services/contracts';
import { BrowserProvider, ethers, Signer } from 'ethers';
import { useMetaMask } from 'metamask-react';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import latestRunJson from '@app/../../contracts/broadcast/Deploy.s.sol/31337/run-latest.json';
export interface EarThereumContextProviderProps {
    children?: ReactNode;
}

export interface EarThereumContextStore {
    count: number;
    earThereumContract: EarThereum | null;
    incCount: () => Promise<void>;
}

interface ForgeDeployment {
    transactions: {
        transactionType: 'CREATE' | 'UNKNOWN';
        contractName: string;
        contractAddress: string;
    }[];
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
            const contractCreateTx = (latestRunJson as ForgeDeployment).transactions.find(
                ({ contractName, transactionType }) => contractName == 'EarThereum' && transactionType == 'CREATE'
            );

            if (!contractCreateTx) {
                throw 'EarThereumProvider: Unable to find contract deployment transaction';
            }

            const earThereumContract = EarThereum__factory.connect(contractCreateTx.contractAddress, signer);
            setEarThereumContract(earThereumContract);
        }
    }, [signer]);

    // Instantiate provider when MetaMask is connected
    useEffect(() => {
        if (status == 'connected' && ethereum) {
            const chainIdNum = parseInt(chainId, 16);
            // Only works on local test
            if (chainIdNum == 31337) {
                const provider = new BrowserProvider(ethereum);
                provider
                    .getSigner()
                    .then((signer) => {
                        setSigner(signer);
                    })
                    .catch((e) => {
                        console.error('Unable to get signer', e);
                    });
            } else {
                setSigner(null);
            }
        }
    }, [status, ethereum, chainId]);

    const getCount = async (earThereumContract: EarThereum) => {
        const count = await earThereumContract.getCounter();
        setCount(Number(count));
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
