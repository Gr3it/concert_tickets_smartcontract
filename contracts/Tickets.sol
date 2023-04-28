// SPDX-License-Identifier: MIT

pragma solidity 0.8.11;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./Soulbound.sol";

contract boywithuke is ERC721, Ownable, SoulBound {
    using Counters for Counters.Counter;

    uint256 public constant MAX_SUPPLY_SALE = 800;
    uint256 public constant MAX_SUPPLY_WHITELIST = 200;
    uint256 public constant PRICE = 1 ether;

    uint256 public immutable START_TIME;

    bytes32 private immutable root;

    Counters.Counter private _whitelistCounter;
    Counters.Counter private _saleCounter;

    mapping(address => bool) public whitelistMinted;

    constructor(
        bytes32 _root
    )
        ERC721("boywithuke concert ticket", "BWU")
        SoulBound("boywithuke SB", "BWU_SB")
    {
        START_TIME = block.timestamp;
        root = _root;
    }

    modifier callerIsUser() {
        require(tx.origin == msg.sender, "The caller is another contract");
        _;
    }

    function totalSupply() public view returns (uint256) {
        return _whitelistCounter.current() + _saleCounter.current();
    }

    function walletOfOwner(
        address _owner
    ) external view returns (uint256[] memory) {
        uint256 ownerTokenCount = balanceOf(_owner);
        uint256[] memory ownedTokenIds = new uint256[](ownerTokenCount);
        uint256 currentTokenId = 1;
        uint256 ownedTokenIndex = 0;

        while (
            ownedTokenIndex < ownerTokenCount &&
            currentTokenId <= MAX_SUPPLY_SALE + MAX_SUPPLY_WHITELIST
        ) {
            if (_exists(currentTokenId)) {
                address currentTokenOwner = ownerOf(currentTokenId);

                if (currentTokenOwner == _owner) {
                    ownedTokenIds[ownedTokenIndex] = currentTokenId;

                    ownedTokenIndex++;
                }
            }

            currentTokenId++;
        }

        return ownedTokenIds;
    }

    function whitelistTicketsMint(
        bytes32[] calldata _proof
    ) external payable callerIsUser {
        require(
            _whitelistCounter.current() + 1 <= MAX_SUPPLY_WHITELIST,
            "Buy exceeds max supply"
        );
        require(whitelistMinted[msg.sender] == false, "Ticket already bought");
        require(_proof.length > 0, "Proof can't be empty");
        require(
            MerkleProof.verify(
                _proof,
                root,
                bytes32(keccak256(abi.encodePacked(msg.sender)))
            ),
            "User not whitelisted"
        );
        require(msg.value >= PRICE, "Price not met");

        whitelistMinted[msg.sender] = true;

        _whitelistCounter.increment();
        _mint(msg.sender, _whitelistCounter.current());

        if (_whitelistCounter.current() <= 20) {
            _SBmint(msg.sender, _whitelistCounter.current());
        }
    }

    function TicketsMint() external payable callerIsUser {
        require(
            _saleCounter.current() + 1 <= MAX_SUPPLY_SALE,
            "Buy exceeds max supply"
        );

        require(msg.value >= PRICE, "Price not met");

        _saleCounter.increment();
        _mint(msg.sender, _saleCounter.current() + 200);
    }

    function EndConcert() external {
        require(
            _whitelistCounter.current() + _saleCounter.current() >= 1000 ||
                block.timestamp >= START_TIME + 10 days
        );

        selfdestruct(payable(owner()));
    }
}
