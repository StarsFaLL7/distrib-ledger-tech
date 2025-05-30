// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TUSDT is ERC20 {
    uint8 private immutable _customDecimals;

    constructor(uint256 initialSupply, uint8 customDecimals) ERC20("Test USDT", "TUSDT") {
        _customDecimals = customDecimals;
        _mint(msg.sender, initialSupply * (10 ** customDecimals));
    }

    function decimals() public view override returns (uint8) {
        return _customDecimals;
    }
}