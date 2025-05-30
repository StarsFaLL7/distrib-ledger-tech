import { expect } from "chai";
import { ethers } from "hardhat";
import { Escrow } from "../typechain-types";
import { parseEther } from "viem";

describe("Escrow", function () {
  let escrowContract: Escrow;
  let dealId = 0;
  before(async () => {
    const escrowContractFactory = await ethers.getContractFactory("Escrow");
    escrowContract = (await escrowContractFactory.deploy()) as Escrow;
    await escrowContract.waitForDeployment();
  });

  describe("DealsCount", function () {
    it("Should have the right deals count on deploy", async function () {
      expect(await escrowContract.getDealCount()).to.equal(0);
    });

    it("Should have the right deals count after creation of deal", async function () {
      const [, acc1, acc2] = await ethers.getSigners();
      await escrowContract.createDealEth(acc1.address, acc2.address, Math.floor(addDaysUnixTimestamp(Date.now(), 2)), {
        value: parseEther("1"),
      });
      expect(await escrowContract.getDealCount()).to.equal(dealId + 1);
    });
  });

  describe("CreateDeal", function () {
    it("Deal should have the right properties after creation", async function () {
      const [acc0, acc1, acc2] = await ethers.getSigners();
      const dt = Math.floor(addDaysUnixTimestamp(Date.now(), 2) / 1000);
      await escrowContract.createDealEth(acc1.address, acc2.address, dt, { value: parseEther("1") });
      dealId++;
      console.log(await escrowContract.getDealCount());
      console.log(dealId);
      const info = await escrowContract.getDealInfo(dealId);
      const deal = ConvertDealResponseToObject(info);
      expect(deal.buyer).to.equal(acc0.address);
      expect(deal.seller).to.equal(acc1.address);
      expect(deal.arbiter).to.equal(acc2.address);
      expect(deal.amount).to.equal(parseEther("1"));
      expect(deal.tokenSymbol).to.equal("ETH");
      expect(BigInt(Math.floor(Number(deal.deadline)))).to.equal(BigInt(dt));
      expect(deal.buyerApproved).to.equal(false);
      expect(deal.sellerApproved).to.equal(false);
      expect(deal.resolved).to.equal(false);
    });
  });

  describe("Approved deal", function () {
    it("Deal should change the sellerApproved status after approve", async function () {
      const [acc0, acc1, acc2] = await ethers.getSigners();
      const dt = Math.floor(addDaysUnixTimestamp(Date.now(), 2) / 1000);
      escrowContract = escrowContract.connect(acc0);
      await escrowContract.createDealEth(acc1.address, acc2.address, dt, { value: parseEther("1") });
      dealId++;
      let deal = ConvertDealResponseToObject(await escrowContract.getDealInfo(dealId));
      expect(deal.buyerApproved).to.equal(false);
      expect(deal.sellerApproved).to.equal(false);
      expect(deal.resolved).to.equal(false);

      escrowContract = escrowContract.connect(acc1);
      await escrowContract.approveDeal(dealId);
      deal = ConvertDealResponseToObject(await escrowContract.getDealInfo(dealId));
      expect(deal.sellerApproved).to.equal(true);
    });

    it("Deal should change the buyerApproved status after approve", async function () {
      const [acc0] = await ethers.getSigners();
      escrowContract = escrowContract.connect(acc0);
      await escrowContract.approveDeal(dealId);
      const deal = ConvertDealResponseToObject(await escrowContract.getDealInfo(dealId));
      expect(deal.buyerApproved).to.equal(true);
    });

    it("Deal should change the resolved status after withdraw", async function () {
      const [, acc1] = await ethers.getSigners();
      escrowContract = escrowContract.connect(acc1);
      await escrowContract.withdrawFunds(dealId);
      const deal = ConvertDealResponseToObject(await escrowContract.getDealInfo(dealId));
      expect(deal.resolved).to.equal(true);
    });
  });

  describe("Withdraw funds from deal", function () {
    it("Account should change the balance after withdraw", async function () {
      const [acc0, acc1, acc2] = await ethers.getSigners();
      const dt = Math.floor(addDaysUnixTimestamp(Date.now(), 2) / 1000);
      escrowContract = escrowContract.connect(acc0);
      await escrowContract.createDealEth(acc1.address, acc2.address, dt, { value: parseEther("1") });
      dealId++;
      let deal = ConvertDealResponseToObject(await escrowContract.getDealInfo(dealId));
      await escrowContract.approveDeal(dealId);
      escrowContract = escrowContract.connect(acc1);
      await escrowContract.approveDeal(dealId);

      const oldBalance = await ethers.provider.getBalance(acc1.address);
      console.log("Old balance: ", oldBalance);

      const trx = await (await escrowContract.withdrawFunds(dealId)).wait();
      const gasUsed = BigInt(trx?.gasUsed ?? 0n);
      const totalGasCost = gasUsed * (trx?.gasPrice ?? 0n);
      deal = ConvertDealResponseToObject(await escrowContract.getDealInfo(dealId));
      expect(deal.resolved).to.equal(true);

      const newBalance = await ethers.provider.getBalance(acc1.address);
      console.log("newBalance: ", newBalance);
      expect(newBalance).to.equal(oldBalance + deal.amount - totalGasCost);
    });
  });

  describe("Arbiter resolve", function () {
    it("Deal should be resolved after arbiter resolve and funds should be reverted", async function () {
      const [acc0, acc1, acc2] = await ethers.getSigners();
      const dt = Math.floor(addDaysUnixTimestamp(Date.now(), 2) / 1000);
      escrowContract = escrowContract.connect(acc0);
      await escrowContract.createDealEth(acc1.address, acc2.address, dt, { value: parseEther("1") });
      dealId++;
      let deal = ConvertDealResponseToObject(await escrowContract.getDealInfo(dealId));

      const oldBalance = await ethers.provider.getBalance(acc0.address);

      escrowContract = escrowContract.connect(acc2);
      await escrowContract.resolveDispute(dealId, true);
      deal = ConvertDealResponseToObject(await escrowContract.getDealInfo(dealId));
      expect(deal.resolved).to.equal(true);

      const newBalance = await ethers.provider.getBalance(acc0.address);
      console.log("newBalance: ", newBalance);
      expect(newBalance).to.equal(oldBalance + deal.amount);
    });
  });

  function ConvertDealResponseToObject(response: any) {
    return {
      buyer: response[0],
      seller: response[1],
      arbiter: response[2],
      amount: response[3],
      tokenSymbol: response[4],
      deadline: response[5],
      buyerApproved: response[6],
      sellerApproved: response[7],
      resolved: response[8],
    };
  }

  function addDaysUnixTimestamp(timestampMs: number, days: number): number {
    const msInDay = 86400 * 1000;
    return timestampMs + days * msInDay;
  }
});
