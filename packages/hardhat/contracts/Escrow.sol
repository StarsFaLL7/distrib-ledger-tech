// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./interfaces/IEscrow.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract Escrow is IEscrow {
    address public owner;

    uint256 private nextDealId;
    mapping(uint256 => Deal) private deals;
    mapping(address => uint256[]) private userDealsIds;

    constructor() {
        console.log("Deployed with owner: %s", msg.sender);
        owner = msg.sender;
    }

    modifier isParticipant(uint256 dealId) {
        Deal storage deal = deals[dealId];
        require(msg.sender == deal.buyer || msg.sender == deal.seller, "Not a participant");
        _;
    }

    modifier isArbiter(uint256 dealId) {
        require(msg.sender == deals[dealId].arbiter, "Not the arbiter");
        _;
    }

    modifier isOwner() {
        require(msg.sender == owner, "Not the Owner");
        _;
    }

    function createDeal(address seller, address arbiter, uint256 amount, uint256 deadline, address tokenAddress) external override returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        require(seller != address(0), "Invalid seller address");
        require(arbiter != address(0), "Invalid arbiter address");
        require(seller != msg.sender, "Seller can't be the same as buyer");
        require(seller != arbiter, "Seller can't be an arbiter");
        require(msg.sender != arbiter, "Buyer can't be an arbiter");
        require(block.timestamp <= deadline, "Invalid deal deadline");

        uint256 dealId = nextDealId++;

        IERC20 token = IERC20(tokenAddress);
        console.log("Token created");
        require(
            token.transferFrom(msg.sender, address(this), amount),
            "Token transfer failed"
        );

        deals[dealId] = Deal({
            buyer: msg.sender,
            seller: seller,
            arbiter: arbiter,
            tokenAddress: tokenAddress,
            amount: amount,
            deadline: deadline,
            buyerApproved: false,
            sellerApproved: false,
            resolved: false
        });

        userDealsIds[msg.sender].push(dealId);
        userDealsIds[seller].push(dealId);
        userDealsIds[arbiter].push(dealId);

        emit DealCreated(dealId, msg.sender, seller, amount, deadline);
        console.log("Created deal with id(%s)", dealId);
        return dealId;
    }

    function createDealEth(address seller, address arbiter, uint256 deadline) external payable override returns (uint256) {
        require(msg.value > 0, "Amount must be greater than 0");
        require(seller != address(0), "Invalid seller address");
        require(arbiter != address(0), "Invalid arbiter address");
        require(seller != msg.sender, "Seller can't be the same as buyer");
        require(seller != arbiter, "Seller can't be an arbiter");
        require(msg.sender != arbiter, "Buyer can't be an arbiter");
        require(block.timestamp <= deadline, "Invalid deal deadline");
        
        uint256 dealId = nextDealId++;

        deals[dealId] = Deal({
            buyer: msg.sender,
            seller: seller,
            arbiter: arbiter,
            amount: msg.value,
            tokenAddress: address(0),
            deadline: deadline,
            buyerApproved: false,
            sellerApproved: false,
            resolved: false
        });

        userDealsIds[msg.sender].push(dealId);
        userDealsIds[seller].push(dealId);
        userDealsIds[arbiter].push(dealId);

        emit DealCreated(dealId, msg.sender, seller, msg.value, deadline);
        return dealId;
    }

    function approveDeal(uint256 dealId) external override isParticipant(dealId) {
        Deal storage deal = deals[dealId];
        require(!deal.resolved, "Already resolved deal");
        require(block.timestamp <= deal.deadline, "Deal deadline passed");

        if (msg.sender == deal.buyer) {
            console.log("Buyer approved deal with id(%s)", dealId);
            deal.buyerApproved = true;
        } else if (msg.sender == deal.seller) {
            console.log("Seller approved deal with id(%s)", dealId);
            deal.sellerApproved = true;
        }

        emit DealApproved(dealId, msg.sender);
    }

    function resolveDispute(uint256 dealId, bool revertFunds) external override isArbiter(dealId) {
        Deal storage deal = deals[dealId];
        require(!deal.resolved, "Already resolved deal");

        deal.resolved = true;
        address receiver = revertFunds ? deal.buyer : deal.seller;

        if (deal.tokenAddress == address(0)) {
            payable(receiver).transfer(deal.amount);
        }
        else {
            IERC20 token = IERC20(deal.tokenAddress);
            require(token.transfer(receiver, deal.amount), "Transfer failed");
        }
        
        console.log("Arbiter resolved deal with id(%s), revertFunds: %s", dealId, revertFunds);
        emit DisputeResolved(dealId, revertFunds);
        emit FundsWithdrawn(dealId, receiver, deal.amount);
    }

    function withdrawFunds(uint256 dealId) external override isParticipant(dealId) {
        Deal storage deal = deals[dealId];
        require(!deal.resolved, "Already resolved deal");
        require(deal.buyerApproved && deal.sellerApproved, "Both seller and buyer must approve");

        deal.resolved = true;
        address receiver = deal.seller;

        if (deal.tokenAddress == address(0)) {
            payable(receiver).transfer(deal.amount);
        }
        else {
            IERC20 token = IERC20(deal.tokenAddress);
            require(token.transfer(receiver, deal.amount), "Transfer failed");
        }

        emit FundsWithdrawn(dealId, deal.seller, deal.amount);
        console.log("FundsWithdrawn from deal with id(%s), amount: %s", dealId, deal.amount);
    }

    function getDealInfo(uint256 dealId) external view returns (address buyer, address seller, address arbiter, uint256 amount, string memory tokenSymbol,
                                                                uint256 deadline, bool buyerApproved, bool sellerApproved, bool resolved) {
        Deal storage deal = deals[dealId];
        string memory symbol = "ETH";
        if (deal.tokenAddress != address(0)) {
            IERC20Metadata metadata = IERC20Metadata(deal.tokenAddress);
            symbol = metadata.symbol();
        }

        return (
            deal.buyer, deal.seller, deal.arbiter, deal.amount, symbol,
            deal.deadline, deal.buyerApproved, deal.sellerApproved, deal.resolved
        );
    }

    function getUserDeals(address user) external view returns (uint256[] memory dealsIds) {
        return userDealsIds[user];
    }

    function getDealCount() external view returns (uint256 dealsCount) {
        return nextDealId;
    }
}
