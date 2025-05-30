import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
// import { Contract } from "ethers";

const deployEscrow: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const escrowDeployment = await deploy("Escrow", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const tusdtDeployment = await deploy("TUSDT", {
    from: deployer,
    args: [1000000, 8],
    log: true,
    autoMine: true,
  });

  // const escrowContract = await hre.ethers.getContract<Contract>("Escrow", deployer);
  console.log(">>> Contracts deployer:", deployer);
  console.log(">>> Escrow contract deployed at:", escrowDeployment.address);
  console.log(">>> Test USDT contract deployed at:", tusdtDeployment.address);
};

export default deployEscrow;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
deployEscrow.tags = ["Escrow"];
