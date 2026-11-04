// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import {AccessControl} from '@openzeppelin/contracts/access/AccessControl.sol';
import {ReentrancyGuard} from '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import {Pausable} from '@openzeppelin/contracts/utils/Pausable.sol';
import {MerkleProof} from '@openzeppelin/contracts/utils/cryptography/MerkleProof.sol';

/// @notice Unaudited TESTNET ONLY; fixed supply, no taxes or later mint authority.
contract SentinelToken is ERC20 {
 constructor(address treasury,uint256 supply) ERC20('SentinelX Test Token','SNTX') {
  require(block.chainid==46630||block.chainid==31337,'Testnet only');
  require(treasury!=address(0)&&supply>0,'Invalid supply'); _mint(treasury,supply);
 }
}

/// @notice Admin may pause new bonds, but never withdrawals or seize principal.
contract SentinelBondVault is AccessControl,ReentrancyGuard,Pausable {
 using SafeERC20 for IERC20;
 IERC20 public immutable token; uint256 public immutable delay; uint256 public totalBonded;
 mapping(address=>mapping(address=>uint256)) public bonds;
 struct Withdrawal {uint256 amount;uint256 availableAt;}
 mapping(address=>mapping(address=>Withdrawal)) public withdrawals;
 event Bonded(address indexed user,address indexed operator,uint256 amount);
 event WithdrawalRequested(address indexed user,address indexed operator,uint256 amount,uint256 availableAt);
 event Withdrawn(address indexed user,address indexed operator,uint256 amount);
 constructor(IERC20 asset,address admin,uint256 withdrawalDelay){require(address(asset)!=address(0)&&admin!=address(0)&&withdrawalDelay<=30 days,'Invalid config');token=asset;delay=withdrawalDelay;_grantRole(DEFAULT_ADMIN_ROLE,admin);}
 function bond(address operator,uint256 amount) external nonReentrant whenNotPaused {
  require(operator!=address(0)&&amount>0,'Invalid bond');uint256 beforeBalance=token.balanceOf(address(this));
  token.safeTransferFrom(msg.sender,address(this),amount);
  require(token.balanceOf(address(this))-beforeBalance==amount,'Unsupported token');
  bonds[msg.sender][operator]+=amount;totalBonded+=amount;emit Bonded(msg.sender,operator,amount);
 }
 function requestWithdrawal(address operator,uint256 amount) external {
  require(amount>0&&bonds[msg.sender][operator]>=amount,'Insufficient bond');
  require(withdrawals[msg.sender][operator].amount==0,'Pending withdrawal');
  bonds[msg.sender][operator]-=amount;uint256 at=block.timestamp+delay;
  withdrawals[msg.sender][operator]=Withdrawal(amount,at);emit WithdrawalRequested(msg.sender,operator,amount,at);
 }
 function withdraw(address operator) external nonReentrant {
  Withdrawal memory w=withdrawals[msg.sender][operator];require(w.amount>0&&block.timestamp>=w.availableAt,'Not ready');
  delete withdrawals[msg.sender][operator];totalBonded-=w.amount;token.safeTransfer(msg.sender,w.amount);emit Withdrawn(msg.sender,operator,w.amount);
 }
 function setPaused(bool value) external onlyRole(DEFAULT_ADMIN_ROLE){if(value)_pause();else _unpause();}
}

/// @notice Funded immutable Merkle epochs; admin must be a timelock controlled by a multisig.
contract RewardDistributor is AccessControl,ReentrancyGuard {
 using SafeERC20 for IERC20;
 IERC20 public immutable token;uint256 public liability;uint256 public constant REVIEW_DELAY=2 days;
 struct Epoch {bytes32 root;uint256 funded;uint256 claimed;uint256 opensAt;}
 mapping(uint256=>Epoch) public epochs;mapping(uint256=>mapping(address=>bool)) public claimed;
 event EpochFunded(uint256 indexed epoch,bytes32 root,uint256 amount,uint256 opensAt);
 event RewardClaimed(uint256 indexed epoch,address indexed user,uint256 amount);
 constructor(IERC20 asset,address timelock){require(address(asset)!=address(0)&&timelock!=address(0),'Invalid config');token=asset;_grantRole(DEFAULT_ADMIN_ROLE,timelock);}
 function fundEpoch(uint256 epoch,bytes32 root,uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
  require(root!=bytes32(0)&&amount>0&&epochs[epoch].root==bytes32(0),'Invalid epoch');
  uint256 beforeBalance=token.balanceOf(address(this));token.safeTransferFrom(msg.sender,address(this),amount);
  require(token.balanceOf(address(this))-beforeBalance==amount,'Unsupported token');
  epochs[epoch]=Epoch(root,amount,0,block.timestamp+REVIEW_DELAY);liability+=amount;
  emit EpochFunded(epoch,root,amount,block.timestamp+REVIEW_DELAY);
 }
 function claim(uint256 epoch,uint256 amount,bytes32[] calldata proof) external nonReentrant {
  Epoch storage e=epochs[epoch];require(e.root!=bytes32(0)&&block.timestamp>=e.opensAt,'Review period');
  require(!claimed[epoch][msg.sender]&&amount>0,'Already claimed or zero');
  bytes32 leaf=keccak256(bytes.concat(keccak256(abi.encode(block.chainid,address(this),epoch,msg.sender,amount))));
  require(MerkleProof.verifyCalldata(proof,e.root,leaf),'Invalid proof');require(e.claimed+amount<=e.funded,'Epoch exhausted');
  claimed[epoch][msg.sender]=true;e.claimed+=amount;liability-=amount;token.safeTransfer(msg.sender,amount);emit RewardClaimed(epoch,msg.sender,amount);
 }
}

/// @notice Non-transferable reputation ledger; no ERC721 transfer or purchase functions.
contract GuardianPassport is AccessControl {
 bytes32 public constant VERIFIER_ROLE=keccak256('VERIFIER_ROLE');
 mapping(address=>bool) public registered;mapping(address=>uint256) public reputation;
 mapping(bytes32=>bool) public usedEvidence;
 event Registered(address indexed guardian);event ContributionValidated(address indexed guardian,bytes32 indexed evidence,uint256 points);
 constructor(address admin){require(admin!=address(0),'Invalid admin');_grantRole(DEFAULT_ADMIN_ROLE,admin);}
 function register() external {require(!registered[msg.sender],'Already registered');registered[msg.sender]=true;emit Registered(msg.sender);}
 function validate(address guardian,bytes32 evidence,uint256 points) external onlyRole(VERIFIER_ROLE){require(registered[guardian]&&evidence!=bytes32(0)&&!usedEvidence[evidence]&&points>0&&points<=100,'Invalid contribution');usedEvidence[evidence]=true;reputation[guardian]+=points;emit ContributionValidated(guardian,evidence,points);}
}
