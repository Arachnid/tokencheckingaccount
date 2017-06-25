# Token drop

The problem: Handing out tokens is problematic, because the receiving account also needs enough ether to send a transaction transferring the tokens to the user's account.

The solution: Send the tokens using a 'token drop'. The recipient of the tokens can claim them from the account by signing a message authorising transfer of the tokens to a different account.

Issuing:

 1. Generate a series of accounts (eg, using a mnemonic generator)
 2. Add an ERC20 authorisation for the `TokenDrop` contract sufficient to cover the number of tokens being distributed.
 3. Call `TokenDrop.deposit()` with the list of account addresses, the ERC20 token address, and the number of tokens to allocate to each address.

Redeeming:
 
 1. Have the user sign a message consisting of `(token_drop_address, token_address, recipient)`.
 2. From any account, call `TokenDrop.redeemFor` or `TokenDrop.redeem` with the ERC20 token address, the recipient (optional), and the signature from step 1.

## Caveats

This solution is intended for single-use accounts, like paper wallets and gift cards; you load up the tokens into the account, and the recipient redeems them.

As a result, this contract does not attempt to protect against replay attacks; once the owning account has generated a signature authorising the transfer of a particular ERC20 token, that signature can be used repeatedly to empty the account of any tokens of that type.

Don't use this in situations where the account may be topped up multiple times, or if you do, only generate signatures sending the tokens to an account you control.
