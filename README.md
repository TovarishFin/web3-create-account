# Ethereum Account Usage Demo
This repo serves as an example on how to create ethereum accounnts using the 1.0.0 version of web3. This is meant to be a starting point for knowing how to use web3 for some basic account functionality.

## usage

### from node
This repo uses yargs and runs on node. It runs on node because this is a quicker and easier way of showcasing this functionality rather than in the browser with a GUI.

To use clone the directory and enter the directory. Usage can be found by typing:

```
node accounts.js --help
```

There are three different commands which are explained below. `--help` can be used for any of the commands listed above as well:
```
node accounts.js create --help
```

```
node accounts.js decrypt --help
```

```
node accounts.js transfer --help
```

### from browser
1. run: `yarn build`
1. open `index.html` in your browser
1. open up browser console
1. try these commands:
    * `createAccount(password)`
    * `decryptAccount(password, quiet)`
    * `transferNoobCoin(password, receiver, amount)`
    * `getBalance(address)`

In the browser commands params are not given as a single `argv` object, but instead as different individual parameters.

In order for this to run, it needs to be served up rather than from a local file due to CORS issues. There might be a work around for this, but I couldn't find one in such a short timeframe.

In order to handle dependencies, webpack is used to build the single import file.

Encrypted accounts are stored in localstorage.

If you are having trouble with infura, try setting `infuraKey` to an API key from them. It should work without it though.

### create
`create` creates a new ethereum account and writes the encryped private key to disk. 

It takes two arguments: `--location` and `password`.

Example usage:
```
node accounts.js create --location myAccount.json --password SuP3r1337p4sS
```

#### location
`location` is optional and will use `account.json` in the root of the project directory if not given. 

Example usage would be:
```bash
--location ../myAccount.json
```

#### password
`password` is required and is used to encrypt the private key saved to disk.

Example usage would be:
```bash
--password SuP3r1337p4sS
```

### decrypt
`decrypt` decrypts a private key that has been saved to disk in encrypted format.

It takes two arguments: `--location` and `--password`.

`location` and `password` are used in order to decrypt in a very similar manner to the `create` command.

Example usage:
```
node accounts.js decrypt --location myAccount.json --password SuP3r1337p4sS
```

### transfer
Transfer is meant as a proof of concept showing that the newly created accounts can be used to interact with smart contracts using the same web3 API used to create the account.

It does the following: 
1. takes a given encrypted private key file
1. decrypts it using given password
1. uses public key derived from private key to:
    * get nonce
    * get private key to sign transaction
1. creates instance of `NoobCoin` contract at predefined address
1. uses instance to create tx data
1. estimate gas cost of performing tx
1. estimate gas price
1. send signed tx

**important note!**

*The new address still needs some ether in order to interact with `NoobCoin`! You will need to send some rinkeby ether to this address in order to see it successfully transfer!*

In shorter words, this uses the private key to interact with a previously existing `NoobCoin` contract. It transfers tokens from the newly created account to another account.

#### What is NoobCoin?
`NoobCoin` is a token contract that I previously created where every address that ever has existed or will exist, gets 100e18 NoobCoin (NCN). This is useful so that we can immediately try transfering tokens with the newly created address.

`transfer` takes up to 4 arguments: `--location`, `password`, `receiver`, and `--amount`

Example Usage:
```
node accounts.js transfer \
    --location myAccount.json \
    --password SuP3r1337p4sS \
    --receiver 0x3aC7c51D964b4afc2FbCeC3C3Ac1b731FB7ECed0 \
    --amount 1e18
```

#### location
`location` is the location of the encrypted private key on disk. It is a required argument.

Example usage: 
```
--location myAccount.json
```

#### password
`password` is the password that was used to encrypt the private key. It is a required argument.

Example usage:
```
--password SuP3r1337p4sS
```

#### receiver
`receiver` is the address you are sending `NoobCoin` to. 

`receiver` has a default argument of: `0x3aC7c51D964b4afc2FbCeC3C3Ac1b731FB7ECed0`, which is an address that I (TovarishFin) control. You can change it to an address you control, or just see the tx at etherscan (you will be given a link as part of the output).

Example usage:
```
--receiver 0x3aC7c51D964b4afc2FbCeC3C3Ac1b731FB7ECed0
```

#### amount
`amount` is the amount of `NoobCoin` tokens to send to the `receiver`. A new address has 100e18 tokens (`wei` units). `amount` is also given in `wei` units. Of course, you can only send as much tokens as you have on the address.

`amount` has a default value of `1e18`, which is equivalent to 1 token in `ether` units.

Example usage:
```
--amount 1e18
```

