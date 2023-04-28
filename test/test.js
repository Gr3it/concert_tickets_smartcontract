const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

const oneEther = ethers.utils.parseEther("1");

const main = () => {
  describe("boywithuke", () => {
    let rootHash,
      claimingAddress,
      hexProof,
      leafNodes,
      merkleTree,
      deployer,
      contract;

    it("Contract deployed", async () => {
      deployer = await ethers.getSigners();

      whitelistAddresses = [
        await deployer[0].getAddress(),
        await deployer[1].getAddress(),
        await deployer[2].getAddress(),
        await deployer[3].getAddress(),
      ];
      leafNodes = whitelistAddresses.map((addr) => keccak256(addr));
      merkleTree = new MerkleTree(leafNodes, keccak256, {
        sortPairs: true,
      });
      rootHash = merkleTree.getHexRoot();

      const Contract = await ethers.getContractFactory("boywithuke");
      contract = await Contract.deploy(rootHash);

      expect(await contract.MAX_SUPPLY_SALE()).to.be.equal(800);
      expect(await contract.MAX_SUPPLY_WHITELIST()).to.be.equal(200);
      expect(await contract.START_TIME()).to.be.equal(await getTimeStamp());
      expect(await contract.PRICE()).to.be.equal(oneEther);
    });

    it("Contract whitelist mint", async () => {
      await expect(
        contract.whitelistTicketsMint([], { value: oneEther })
      ).to.be.revertedWith("Proof can't be empty");

      claimingAddress = leafNodes[0];
      hexProof = merkleTree.getHexProof(claimingAddress);

      await expect(
        contract.whitelistTicketsMint(hexProof, { value: 1 })
      ).to.be.revertedWith("Price not met");

      await expect(
        contract
          .connect(deployer[1])
          .whitelistTicketsMint(hexProof, { value: oneEther })
      ).to.be.revertedWith("User not whitelisted");

      const balance = await contract.balanceOf(await deployer[0].getAddress());

      const tx = await contract.whitelistTicketsMint(hexProof, {
        value: oneEther,
      });
      await tx.wait();

      expect(
        await contract.balanceOf(await deployer[0].getAddress())
      ).to.be.equal(balance + 1);

      await expect(
        contract.whitelistTicketsMint(hexProof, { value: oneEther })
      ).to.be.revertedWith("Ticket already bought");
    });

    it("Contract mint", async () => {
      await expect(contract.TicketsMint({ value: 1 })).to.be.revertedWith(
        "Price not met"
      );

      const balance = await contract.balanceOf(await deployer[0].getAddress());

      const tx = await contract.TicketsMint({
        value: oneEther,
      });
      await tx.wait();

      expect(
        await contract.balanceOf(await deployer[0].getAddress())
      ).to.be.equal(balance.add(1));
    });

    it("SoulBound mint", async () => {
      claimingAddress = leafNodes[1];
      hexProof = merkleTree.getHexProof(claimingAddress);

      const balance = await contract.SBbalanceOf(
        await deployer[1].getAddress()
      );

      const tx = await contract
        .connect(deployer[1])
        .whitelistTicketsMint(hexProof, {
          value: oneEther,
        });
      await tx.wait();

      expect(
        await contract.SBbalanceOf(await deployer[1].getAddress())
      ).to.be.equal(balance.add(1));
    });

    it("Wallet of Owner", async () => {
      const array = [1, 201];
      let arrayIDs = [];
      const IDs = await contract.walletOfOwner(deployer[0].getAddress());

      for (let i = 0; i < IDs.length; i++) {
        arrayIDs[i] = IDs[i].toNumber();
      }

      expect(arrayIDs).to.be.deep.equal(array);
    });

    it("Total supply", async () => {
      const supply = await contract.totalSupply();

      claimingAddress = leafNodes[2];
      hexProof = merkleTree.getHexProof(claimingAddress);

      const tx = await contract
        .connect(deployer[2])
        .whitelistTicketsMint(hexProof, {
          value: oneEther,
        });
      await tx.wait();

      expect(await contract.totalSupply()).to.be.equal(supply.add(1));

      const tx2 = await contract.TicketsMint({
        value: oneEther,
      });
      await tx2.wait();

      expect(await contract.totalSupply()).to.be.equal(supply.add(2));
    });

    it("Contract end", async () => {
      await expect(contract.EndConcert()).to.be.reverted;

      await timeJump(10 * 24 * 60 * 60);

      const contractBalance = await ethers.provider.getBalance(
        contract.address
      );

      await expect(() => contract.EndConcert()).to.changeEtherBalance(
        await deployer[0].getAddress(),
        contractBalance
      );
    });
  });
};

const getTimeStamp = async () => {
  const blockNumBefore = await ethers.provider.getBlockNumber();
  const blockBefore = await ethers.provider.getBlock(blockNumBefore);
  const timestampBefore = blockBefore.timestamp;
  return timestampBefore;
};

const timeJump = async (amount) => {
  await network.provider.send("evm_increaseTime", [amount]);
  await network.provider.send("evm_mine");
};

main();
