//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IEscrow {
    struct Deal {
        address buyer;
        address seller;
        address arbiter;
        address tokenAddress;
        uint256 amount;
        uint256 deadline;
        bool buyerApproved;
        bool sellerApproved;
        bool resolved;
    }

    function createDeal(address seller, address arbiter, uint256 amount, uint256 deadline, address tokenAddress) external returns (uint256);

    function createDealEth(address seller, address arbiter, uint256 deadline) external payable returns (uint256);

    function approveDeal(uint256 dealId) external;

    function resolveDispute(uint256 dealId, bool revertFunds) external;

    function withdrawFunds(uint256 dealId) external;

    function getDealInfo(uint256 dealId) external view returns (address buyer, address seller, address arbiter, uint256 amount, string memory tokenSymbol,
                                                                uint256 deadline, bool buyerApproved, bool sellerApproved, bool resolved);

    function getUserDeals(address user) external view returns (uint256[] memory dealsIds);

    function getDealCount() external view returns (uint256 dealsCount);

    event DealCreated(uint256 indexed dealId, address buyer, address seller, uint256 amount, uint256 deadline);

    event DealApproved(uint256 indexed dealId, address approver);

    event DisputeResolved(uint256 indexed dealId, bool buyerWins);

    event FundsWithdrawn(uint256 indexed dealId, address receiver, uint256 amount);
}