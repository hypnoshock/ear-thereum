(cd contracts && rm -r cache out && mkdir out)

(cd contracts && 
forge build && 
forge script script/Deploy.s.sol:GameDeployer --broadcast --rpc-url "https://polygon-mumbai.infura.io/v3/a18339cedb4344d68107f53412cc9ada")

(cd frontend && npm run build:contracts)