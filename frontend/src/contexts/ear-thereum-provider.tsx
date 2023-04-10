/** @format */

import { EarThereum, EarThereum__factory } from '@app/services/contracts';
import { BrowserProvider, Signer } from 'ethers';
import { useMetaMask } from 'metamask-react';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import latestRunJson from '@app/../../contracts/broadcast/Deploy.s.sol/31337/run-latest.json';
export interface EarThereumContextProviderProps {
    children?: ReactNode;
}

export interface EarThereumContextStore {
    earThereumContract: EarThereum | null;
    getExistingSampleIDs: (sampleIDs: string[]) => Promise<string[]>;
    convertIDsToBytes4: (sampleIDs: string[]) => Buffer[];
    uploadedTunes: string[];
    uploadedSamples: string[];
}

interface ForgeDeployment {
    transactions: {
        transactionType: 'CREATE' | 'UNKNOWN';
        contractName: string;
        contractAddress: string;
    }[];
}

function getDeployBlockHash(contractName: string): string {
    const tx = latestRunJson.transactions.find(
        (tx) => tx.contractName == contractName && tx.transactionType == 'CREATE'
    );
    if (tx) {
        const receipt = latestRunJson.receipts.find((r) => r.transactionHash == tx?.hash);
        return receipt ? receipt.blockHash : '';
    }

    return '';
}

export const EarThereumContext = createContext<EarThereumContextStore>({} as EarThereumContextStore);

export const useEarThereumContext = () => useContext(EarThereumContext);

export const EarThereumProvider = ({ children }: EarThereumContextProviderProps) => {
    const { status, ethereum, chainId } = useMetaMask();
    const [earThereumContract, setEarThereumContract] = useState<EarThereum | null>(null);
    const [signer, setSigner] = useState<Signer | null>(null);
    const [uploadedTunes, setUploadedTunes] = useState<string[]>([]);
    const [uploadedSamples, setUploadedSamples] = useState<string[]>([]);

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

    useEffect(() => {
        if (earThereumContract) {
            // TODO: set the block to the contract deploy block. This will get all tunes/samples from
            //       the start of this project which is fine for now but obviously won't scale
            const blockHash = getDeployBlockHash('EarThereum');
            console.log(`blockHash: ${blockHash}`);

            // Samples
            const sampleUploadFilter = earThereumContract.filters.SampleUploaded();
            earThereumContract.queryFilter(sampleUploadFilter).then((logs) => {
                const sampleIDs = logs.map((log) => {
                    return log.args[0].replace('0x', '');
                });
                const uniqueSampleIDs = sampleIDs.filter((sampleID, idx, self) => {
                    return self.indexOf(sampleID) === idx;
                });
                setUploadedSamples(uniqueSampleIDs);
            });

            // Tunes (XMs)
            earThereumContract.queryFilter(earThereumContract.filters.SongUploaded()).then((logs) => {
                const tuneIDs = logs.map((log) => {
                    return log.args[0];
                });
                const uniqueTuneIDs = tuneIDs.filter((tuneID, idx, self) => {
                    return self.indexOf(tuneID) === idx;
                });
                setUploadedTunes(uniqueTuneIDs);
            });
        }
    }, [earThereumContract]);

    useEffect(() => {
        if (earThereumContract) {
            // Samples event
            const sampleUploadedEvent = earThereumContract.getEvent('SampleUploaded');
            earThereumContract.on(earThereumContract.getEvent('SampleUploaded'), (idPrefixed: string) => {
                const id = idPrefixed.replace('0x', '');
                if (!uploadedSamples.includes(id)) {
                    setUploadedSamples([...uploadedSamples, id]);
                }
            });

            // Tunes event
            const songUploadedEvent = earThereumContract.getEvent('SongUploaded');
            earThereumContract.on(songUploadedEvent, (idPrefixed: string) => {
                const id = idPrefixed.replace('0x', '');
                if (!uploadedTunes.includes(id)) {
                    setUploadedTunes([...uploadedTunes, id]);
                }
            });

            // cleanup function to unsubscribe from the event when the component unmounts
            return () => {
                earThereumContract.removeAllListeners(sampleUploadedEvent);
                earThereumContract.removeAllListeners(songUploadedEvent);
            };
        }

        return;
    }, [earThereumContract, uploadedSamples, uploadedTunes]);

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

    // TODO: Should be able to use the IDs fetched from the logs instead of asking the contract
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
        earThereumContract,
        uploadedTunes,
        uploadedSamples,
        getExistingSampleIDs,
        convertIDsToBytes4
    };

    return <EarThereumContext.Provider value={store}>{children}</EarThereumContext.Provider>;
};
