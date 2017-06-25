var ERC20TestToken = artifacts.require("./ERC20TestToken.sol");
var TokenCheckingAccount = artifacts.require("./TokenCheckingAccount.sol");

module.exports = function(deployer) {
  deployer.deploy(ERC20TestToken);
  deployer.deploy(TokenCheckingAccount);
};
