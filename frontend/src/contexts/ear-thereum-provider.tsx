/** @format */

import { EarThereum, EarThereum__factory } from '@app/services/contracts';
import { BrowserProvider, JsonRpcProvider, Signer } from 'ethers';
import { useMetaMask } from 'metamask-react';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import deployLocal from '@app/../../contracts/broadcast/Deploy.s.sol/31337/run-latest.json';
import deployPolygonTest from '@app/../../contracts/broadcast/Deploy.s.sol/80001/run-latest.json';
// import deployPolygonMain from '@app/../../contracts/broadcast/Deploy.s.sol/137/run-latest.json';

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
        hash: string;
    }[];
    receipts: {
        transactionHash: string;
        blockHash: string;
    }[];
}

function getDeployBlockHash(contractName: string, deployment: ForgeDeployment): string {
    const tx = deployment.transactions.find((tx) => tx.contractName == contractName && tx.transactionType == 'CREATE');
    if (tx) {
        const receipt = deployment.receipts.find((r) => r.transactionHash == tx?.hash);
        return receipt ? receipt.blockHash : '';
    }

    return '';
}

function getDeployment(chainId: number): ForgeDeployment | null {
    switch (chainId) {
        case 31337:
            return deployLocal as ForgeDeployment;
        case 80001:
            return null; //deployPolygonTest as ForgeDeployment;
        // case 137:
        //     return deployPolygonMain as ForgeDeployment;
        default:
            return null;
    }
}

export const EarThereumContext = createContext<EarThereumContextStore>({} as EarThereumContextStore);

export const useEarThereumContext = () => useContext(EarThereumContext);

export const EarThereumProvider = ({ children }: EarThereumContextProviderProps) => {
    const { status, ethereum, chainId } = useMetaMask();
    const [earThereumContract, setEarThereumContract] = useState<EarThereum | null>(null);
    const [signer, setSigner] = useState<Signer | null>(null);
    const [provider, _] = useState(null);
    // new JsonRpcProvider('https://polygon-mumbai.infura.io/v3/a18339cedb4344d68107f53412cc9ada')
    const [uploadedTunes, setUploadedTunes] = useState<string[]>([]);
    const [uploadedSamples, setUploadedSamples] = useState<string[]>([]);
    const [deployment, setDeployment] = useState<ForgeDeployment | null>(null);

    useEffect(() => {
        if (chainId) {
            const chainIdNum = parseInt(chainId, 16);
            const deployment = getDeployment(chainIdNum);
            setDeployment(deployment);
        } else {
            // Default to mumbai
            // const deployment = getDeployment(80001);
            // setDeployment(deployment);

            console.log(`No deployment for chain: ${chainId}`);
        }
    }, [chainId]);

    // Instantiate provider when MetaMask is connected
    useEffect(() => {
        if (status == 'connected' && ethereum && deployment) {
            if (deployment) {
                const provider = new BrowserProvider(ethereum); // TODO: Set provider as this
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
    }, [status, ethereum, deployment]);

    // Instantiate contract when provider ready
    useEffect(() => {
        if (deployment && (signer || provider)) {
            const contractCreateTx = deployment.transactions.find(
                ({ contractName, transactionType }) => contractName == 'EarThereum' && transactionType == 'CREATE'
            );

            if (!contractCreateTx) {
                throw 'EarThereumProvider: Unable to find contract deployment transaction';
            }

            const earThereumContract = EarThereum__factory.connect(
                contractCreateTx.contractAddress,
                signer || provider
            );
            setEarThereumContract(earThereumContract);
        }
    }, [signer, provider, deployment]);

    // Get the tune and sample upload event logs
    useEffect(() => {
        if (earThereumContract && deployment) {
            // TODO: set the block to the contract deploy block. This will get all tunes/samples from
            //       the start of this project which is fine for now but obviously won't scale
            const blockHash = getDeployBlockHash('EarThereum', deployment);
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
    }, [earThereumContract, deployment]);

    // Subscribe to the events
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
        return () => {};
    }, [earThereumContract, uploadedSamples, uploadedTunes]);

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
