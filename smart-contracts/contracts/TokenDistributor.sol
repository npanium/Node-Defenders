// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "./SoulToken.sol";
import "./GodsToken.sol";

/**
 * @title TokenDistributor
 * @dev Contract for distributing both SOUL and GODS tokens
 */
contract TokenDistributor is Ownable {
    SoulToken public soulToken;
    GodsToken public godsToken;

    // Optional: Track mints per address
    mapping(address => bool) public hasMinted;

    // Optional: Add small fee if desired
    uint256 public mintFee = 0; // Set to 0 for free minting

    constructor(address _soulToken, address _godsToken) Ownable(msg.sender) {
        soulToken = SoulToken(_soulToken);
        godsToken = GodsToken(_godsToken);
    }

    function mintTokens(
        address recipient,
        uint256 soulAmount,
        uint256 godsAmount
    ) external payable {
        // Optional: Check if the user has already minted
        // require(!hasMinted[recipient], "Already minted");

        // Optional: Check fee
        require(msg.value >= mintFee, "Insufficient fee");

        // Mint both tokens
        soulToken.mint(recipient, soulAmount);
        godsToken.mint(recipient, godsAmount);

        // Optional: Mark as minted
        // hasMinted[recipient] = true;

        // Optional: Emit event for tracking
        emit TokensMinted(recipient, soulAmount, godsAmount);
    }

    function authorizedMint(
        address recipient,
        uint256 soulAmount,
        uint256 godsAmount
    ) external onlyOwner {
        // This can only be called by the contract owner (your backend)
        soulToken.mint(recipient, soulAmount);
        godsToken.mint(recipient, godsAmount);

        emit TokensMinted(recipient, soulAmount, godsAmount);
    }

    function setMintFee(uint256 newFee) external onlyOwner {
        mintFee = newFee;
    }

    /**
     * @dev Withdraw ETH collected from fees
     */
    function withdraw() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }

    // Event for tracking mints
    event TokensMinted(
        address indexed recipient,
        uint256 soulAmount,
        uint256 godsAmount
    );
}
