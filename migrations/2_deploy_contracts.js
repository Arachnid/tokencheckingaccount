var ERC20TestToken = artifacts.require("./ERC20TestToken.sol");
var TokenDrop = artifacts.require("./TokenDrop.sol");

module.exports = function(deployer) {
  deployer.deploy(ERC20TestToken);
  deployer.deploy(TokenDrop);
};
