DEPLOYER_PRIVATE_KEY="0x6335c92c05660f35b36148bbfb2105a68dd40275ebf16eff9524d487fb5d57a8"

# (cd contracts && rm -r cache out && mkdir out)

(cd contracts && /
forge build && /
forge script script/Deploy.s.sol:GameDeployer --broadcast --rpc-url "http://localhost:8545")

(cd frontend && /
npm run build:contracts)