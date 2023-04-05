// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import {EarThereum} from "src/Earthereum.sol";

contract GameDeployer is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerKey);

        EarThereum et = new EarThereum();
        console2.log("deployed", address(et));

        vm.stopBroadcast();
    }
}
