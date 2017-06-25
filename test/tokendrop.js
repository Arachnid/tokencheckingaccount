var TokenDrop = artifacts.require("./TokenDrop.sol");
var ERC20TestToken = artifacts.require("./ERC20TestToken.sol");

contract('TokenDrop', function(accounts) {
  it("should handle deposits", function() {
    return TokenDrop.deployed().then(function(td) {
      return ERC20TestToken.deployed().then(function(token) {
        // Issue tokens to accounts[0]
        return token.issue(1e18, {from: accounts[0]}).then(function() {
          // Approve 1e18 tokens for the token drop contract
          return token.approve(td.address, 1e18, {from: accounts[0]});
        }).then(function() {
          // Deposit 1e16 tokens in each of accounts[1] and accounts[2]
          return td.deposit(token.address, [accounts[1], accounts[2], accounts[3]], 1e16, {from: accounts[0]});
        }).then(function() {
          // Check the balance of accounts[1]
          return td.balances.call(token.address, accounts[1]);
        }).then(function(balance) {
          assert.equal(balance, 1e16);
          // Check the balance of accounts[2]
          return td.balances.call(token.address, accounts[2]);
        }).then(function(balance) {
          assert.equal(balance, 1e16);
          // Check token balance of accounts[0]
          return token.balanceOf.call(accounts[0]);
        }).then(function(balance) {
          assert.equal(balance, 1e18 - 3e16);
          // Check token balance of token drop account
          return token.balanceOf.call(td.address);
        }).then(function(balance) {
          assert.equal(balance, 3e16);
        });
      });
    });
  });

  function signDrop(sender, td, token, recipient) {
    var data = td + token.slice(2) + recipient.slice(2);
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
    return TokenDrop.deployed().then(function(td) {
      return ERC20TestToken.deployed().then(function(token) {
        // Sign a message transferring tokens owned by accounts[1] to accounts[4]
        var sig = signDrop(accounts[1], td.address, token.address, accounts[4])
        // Try and redeem it for accounts[0]
        return td.redeemFor(token.address, accounts[0], sig.v, sig.r, sig.s, {from: accounts[0]}).then(function() {
          assert.fail("Expected exception");
        }).catch(function() { });
      });
    });
  });

  it("should redeem tokens using redeem()", function() {
    return TokenDrop.deployed().then(function(td) {
      return ERC20TestToken.deployed().then(function(token) {
        // Sign a message transferring tokens owned by accounts[1] to accounts[4]
        var sig = signDrop(accounts[1], td.address, token.address, accounts[4])
        return td.redeem(token.address, sig.v, sig.r, sig.s, {from: accounts[4]}).then(function() {
          // Check token balance of receiving account
          return token.balanceOf.call(accounts[4]);
        }).then(function(balance) {
          assert.equal(balance, 1e16);
          // Check token balance of token drop account
          return token.balanceOf.call(td.address);
        }).then(function(balance) {
          assert.equal(balance, 2e16);
          // Check token balance of sending account in token drop account
          return td.balances.call(token.address, accounts[1]);
        }).then(function(balance) {
          assert.equal(balance, 0);
        });
      });
    });
  });

  it("should redeem tokens using redeemFor()", function() {
    return TokenDrop.deployed().then(function(td) {
      return ERC20TestToken.deployed().then(function(token) {
        // Sign a message transferring tokens owned by accounts[2] to accounts[4]
        var sig = signDrop(accounts[2], td.address, token.address, accounts[4])
        return td.redeemFor(token.address, accounts[4], sig.v, sig.r, sig.s, {from: accounts[0]}).then(function() {
          // Check token balance of receiving account
          return token.balanceOf.call(accounts[4]);
        }).then(function(balance) {
          assert.equal(balance, 2e16);
          // Check token balance of token drop account
          return token.balanceOf.call(td.address);
        }).then(function(balance) {
          assert.equal(balance, 1e16);
          // Check token balance of sending account in token drop account
          return td.balances.call(token.address, accounts[2]);
        }).then(function(balance) {
          assert.equal(balance, 0);
        });
      });
    });
  });

  it("should allow withdrawing tokens with withdraw()", function() {
    return TokenDrop.deployed().then(function(td) {
      return ERC20TestToken.deployed().then(function(token) {
        return td.withdraw(token.address, {from: accounts[3]}).then(function() {
          // Check token balance of receiving account
          return token.balanceOf.call(accounts[3]);          
        }).then(function(balance) {
          assert.equal(balance, 1e16);
          // Check token balance of sending account in token drop account
          return td.balances.call(token.address, accounts[3]);
        }).then(function(balance) {
          assert.equal(balance, 0);
        });
      });
    });
  });
});
