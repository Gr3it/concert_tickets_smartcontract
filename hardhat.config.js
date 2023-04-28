require("dotenv").config();

require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.11",
    settings: {
      optimizer: {
        enabled: true,
        runs: 2000,
      },
    },
  },
  networks: {
    sepolia: {
      url: `${RPC}`,
      accounts: [`${PRIVATE_KEY}`],
    },
  },
  mocha: {
    timeout: 40000,
  },
};
