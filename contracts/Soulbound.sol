// SPDX-License-Identifier: MIT

pragma solidity 0.8.11;

contract SoulBound {
    string private _name;

    string private _symbol;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;

    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    event SBMint(address indexed to, uint256 indexed id);

    function SBbalanceOf(address owner) public view virtual returns (uint256) {
        require(
            owner != address(0),
            "soulBound: address zero is not a valid owner"
        );
        return _balances[owner];
    }

    function SBownerOf(uint256 tokenId) public view virtual returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "soulBound: invalid token ID");
        return owner;
    }

    function SBname() public view virtual returns (string memory) {
        return _name;
    }

    function SBsymbol() public view virtual returns (string memory) {
        return _symbol;
    }

    function _SBexists(uint256 tokenId) internal view virtual returns (bool) {
        return _owners[tokenId] != address(0);
    }

    function _SBmint(address to, uint256 tokenId) internal virtual {
        require(to != address(0), "soulBound: mint to the zero address");
        require(!_SBexists(tokenId), "soulBound: token already minted");

        _balances[to] += 1;

        _owners[tokenId] = to;

        emit SBMint(to, tokenId);
    }
}
