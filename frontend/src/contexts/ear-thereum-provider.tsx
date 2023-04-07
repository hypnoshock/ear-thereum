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
    getExistingSampleIDs: (sampleIDs: string[]) => Promise<string[]>;
    convertIDsToBytes4: (sampleIDs: string[]) => Buffer[];
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

    const convertIDsToBytes4 = (sampleIDs: string[]) => {
        return sampleIDs.map((sampleID) => Buffer.from(sampleID, 'hex'));
    };

    const getExistingSampleIDs = async (sampleIDs: string[]): Promise<string[]> => {
        if (earThereumContract) {
            const sampleIDsBytes = convertIDsToBytes4(sampleIDs);
            const { existingSampleIDs } = await earThereumContract.getExistingSampleIDs(sampleIDsBytes);
            return existingSampleIDs
                .map((sampleID) => sampleID.replace('0x', ''))
                .filter((sampleID) => sampleID != '00000000');
        } else {
            return [];
        }
    };

    const store: EarThereumContextStore = {
        count,
        earThereumContract,
        getExistingSampleIDs,
        convertIDsToBytes4
    };

    return <EarThereumContext.Provider value={store}>{children}</EarThereumContext.Provider>;
};
