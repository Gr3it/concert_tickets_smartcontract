const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const whitelistAddresses = [await deployer.getAddress()];
  const leafNodes = whitelistAddresses.map((addr) => keccak256(addr));
  const merkleTree = new MerkleTree(leafNodes, keccak256, {
    sortPairs: true,
  });
  const rootHash = merkleTree.getHexRoot();

  console.log(rootHash);

  const Contract = await ethers.getContractFactory("boywithuke");
  const contract = await Contract.deploy(rootHash);

  console.log("Contract address:", contract.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
