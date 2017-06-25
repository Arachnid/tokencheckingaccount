# Token checking account

The problem: Handing out tokens is problematic, because the receiving account
also needs enough ether to send a transaction transferring the tokens to the
user's account.

The solution: Send the tokens to a 'checking account'. The recipient of the
tokens can claim them from the account by writing a 'cheque' - a signed
message authorising transfer of the tokens to a different account.

Issuing:

 1. Generate a series of accounts (eg, using a mnemonic generator)
 2. Add an ERC20 authorisation for the `TokenCheckingAccount` contract
    sufficient to cover the number of tokens being distributed.
 3. Call `TokenCheckingAccount.deposit()` with the list of account addresses,
    the ERC20 token address, and the number of tokens to allocate to each address.

Redeeming:
 
 1. Have the user sign a message consisting of
    `(checking_account_address, token_address, recipient)`.
 2. From any account, call `TokenCheckingAccount.redeemFor` or
    `TokenCodeRedeemer.redeem` with the ERC20 token address, the recipient
    (optional), and the signature from step 1.
