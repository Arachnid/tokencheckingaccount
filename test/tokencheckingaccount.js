var TokenCheckingAccount = artifacts.require("./TokenCheckingAccount.sol");
var ERC20TestToken = artifacts.require("./ERC20TestToken.sol");

contract('TokenCheckingAccount', function(accounts) {
  it("should handle deposits", function() {
    return TokenCheckingAccount.deployed().then(function(tca) {
      return ERC20TestToken.deployed().then(function(token) {
        // Issue tokens to accounts[0]
        return token.issue(1e18, {from: accounts[0]}).then(function() {
          // Approve 1e18 tokens for the checking account
          return token.approve(tca.address, 1e18, {from: accounts[0]});
        }).then(function() {
          // Deposit 1e16 tokens in each of accounts[1] and accounts[2]
          return tca.deposit(token.address, [accounts[1], accounts[2], accounts[3]], 1e16, {from: accounts[0]});
        }).then(function() {
          // Check the balance of accounts[1]
          return tca.balances.call(token.address, accounts[1]);
        }).then(function(balance) {
          assert.equal(balance, 1e16);
          // Check the balance of accounts[2]
          return tca.balances.call(token.address, accounts[2]);
        }).then(function(balance) {
          assert.equal(balance, 1e16);
          // Check token balance of accounts[0]
          return token.balanceOf.call(accounts[0]);
        }).then(function(balance) {
          assert.equal(balance, 1e18 - 3e16);
          // Check token balance of checking account
          return token.balanceOf.call(tca.address);
        }).then(function(balance) {
          assert.equal(balance, 3e16);
        });
      });
    });
  });

  function signCheck(sender, tca, token, recipient) {
    var data = tca + token.slice(2) + recipient.slice(2);
    // We have to hash this ourselves because of https://github.com/ethereumjs/testrpc/issues/243
    // When using ethereumjs-wallet / provider-framework, don't hash.
    var sigdata = web3.eth.sign(sender, web3.sha3(data, {encoding: 'hex'}));
    return {
      r: sigdata.slice(0, 66),
      s: "0x" + sigdata.slice(66, 130),
      v: parseInt(sigdata.slice(130, 132), 16) + 27,
    };
  }

  it("should reject invalid signatures", function() {
    return TokenCheckingAccount.deployed().then(function(tca) {
      return ERC20TestToken.deployed().then(function(token) {
        // Sign a check transferring tokens owned by accounts[1] to accounts[4]
        var sig = signCheck(accounts[1], tca.address, token.address, accounts[4])
        // Try and redeem it for accounts[0]
        return tca.redeemFor(token.address, accounts[0], sig.v, sig.r, sig.s, {from: accounts[0]}).then(function() {
          assert.fail("Expected exception");
        }).catch(function() { });
      });
    });
  });

  it("should redeem checks using redeem()", function() {
    return TokenCheckingAccount.deployed().then(function(tca) {
      return ERC20TestToken.deployed().then(function(token) {
        // Sign a check transferring tokens owned by accounts[1] to accounts[4]
        var sig = signCheck(accounts[1], tca.address, token.address, accounts[4])
        return tca.redeem(token.address, sig.v, sig.r, sig.s, {from: accounts[4]}).then(function() {
          // Check token balance of receiving account
          return token.balanceOf.call(accounts[4]);
        }).then(function(balance) {
          assert.equal(balance, 1e16);
          // Check token balance of checking account contract
          return token.balanceOf.call(tca.address);
        }).then(function(balance) {
          assert.equal(balance, 2e16);
          // Check token balance of sending account in checking account contract
          return tca.balances.call(token.address, accounts[1]);
        }).then(function(balance) {
          assert.equal(balance, 0);
        });
      });
    });
  });

  it("should redeem checks using redeemFor()", function() {
    return TokenCheckingAccount.deployed().then(function(tca) {
      return ERC20TestToken.deployed().then(function(token) {
        // Sign a check transferring tokens owned by accounts[2] to accounts[4]
        var sig = signCheck(accounts[2], tca.address, token.address, accounts[4])
        return tca.redeemFor(token.address, accounts[4], sig.v, sig.r, sig.s, {from: accounts[0]}).then(function() {
          // Check token balance of receiving account
          return token.balanceOf.call(accounts[4]);
        }).then(function(balance) {
          assert.equal(balance, 2e16);
          // Check token balance of checking account contract
          return token.balanceOf.call(tca.address);
        }).then(function(balance) {
          assert.equal(balance, 1e16);
          // Check token balance of sending account in checking account contract
          return tca.balances.call(token.address, accounts[2]);
        }).then(function(balance) {
          assert.equal(balance, 0);
        });
      });
    });
  });

  it("should allow withdrawing tokens with withdraw()", function() {
    return TokenCheckingAccount.deployed().then(function(tca) {
      return ERC20TestToken.deployed().then(function(token) {
        return tca.withdraw(token.address, {from: accounts[3]}).then(function() {
          // Check token balance of receiving account
          return token.balanceOf.call(accounts[3]);          
        }).then(function(balance) {
          assert.equal(balance, 1e16);
          // Check token balance of sending account in checking account contract
          return tca.balances.call(token.address, accounts[3]);
        }).then(function(balance) {
          assert.equal(balance, 0);
        });
      });
    });
  });
});
