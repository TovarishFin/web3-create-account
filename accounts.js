#!/usr/bin/env node

const fs = require('fs')
const util = require('util')
// terminal arguments library
const yargs = require('yargs')
// library for terminal colors
const chalk = require('chalk')

// web3 used for communicating with blockchain from js
const Web3 = require('web3')
// library for creating raw transactions
const Tx = require('ethereumjs-tx')

// previous project smart contract on rinkeby testnet. All addresses start with 100e18 NoobCoin tokens
const noobCoinAddress = '0xd682fedb50f8d895c940bcac39472b0fd10966ab'
// setup web3 to use infura node using rinkeby testnet
const web3 = new Web3('https://rinkeby.infura.io')
// contract definition used in order to "talk" to it
const NoobCoin = require('./NoobCoin')
// instantiate contract using definition at address
const noobCoin = new web3.eth.Contract(NoobCoin, noobCoinAddress)

// creates an account and saves the encrypted privateKey to disk
const createAccount = argv => {
  const account = web3.eth.accounts.create()
  console.log(chalk.magenta(`Wrote encrypted account to ${argv.location}. Use decrypt to access later.`))
  // encrypt the newly created account private key using given password
  const encryptedAccount = web3.eth.accounts.encrypt(account.privateKey, argv.password)
  fs.writeFileSync(argv.location, JSON.stringify(encryptedAccount))
}

// decrypts an encrypted private key at a given location using given password
const decryptAccount = (argv, quiet) => {
  const encryptedAccount = JSON.parse(fs.readFileSync(argv.location))
  const account = web3.eth.accounts.decrypt(encryptedAccount, argv.password)
  if (!quiet) {
    console.log(chalk.yellow('account decrypted: '))
    console.log(chalk.green(util.inspect(account, false, null)))
  }
  return account
}

// sends preAllocated NoobCoin to hardcoded address using encrypted account
const transferNoobCoin = async argv => {
  console.log('attempting to transfer using NoobCoin contract (please be patient): ')
  console.log(chalk.blue.underline(
    'https://rinkeby.etherscan.io/address/0xd682fedb50f8d895c940bcac39472b0fd10966ab'
  ))

  try {
    console.log(chalk.yellow('gathering data for tx...'))
    // get decrypted account
    const account = decryptAccount(argv, true)
    // ethereumjs-tx requires private key to be a buffer, also needs to NOT have 0x prepended
    const privateKey = new Buffer(account.privateKey.replace('0x', ''), 'hex')
    // get the data that goes in a tx for this contract method given the args used
    const data = noobCoin.methods.transfer(argv.receiver, argv.amount).encodeABI()
    // need to have current nonce of account to properly form tx
    // nonce is incremented every time an account makes a state changing transaction
    const nonce = await web3.eth.getTransactionCount(account.address)
    // get current gasPrice for current network
    const gasPrice = await web3.eth.getGasPrice()
    // estimate the gas cost of perfoming tx given tx data created from contract method
    const gasEstimate = await web3.eth.estimateGas({
      to: noobCoinAddress,
      data
    })
    // set gas limit to 500k over the gas estimate to be on the safe side
    const gasLimit = gasEstimate + 5e5

    console.log(chalk.yellow('creating the tx...'))
    // values need to be in hex: 0x needs be prepended indicating hex values
    const rawTx = {
      nonce: '0x' + nonce.toString(16),
      gasPrice: '0x' + gasPrice.toString(16),
      gasLimit: '0x' + gasLimit.toString(16),
      to: noobCoinAddress,
      value: '0x0',
      data
    }

    // use tx ethereumjs-tx library to create tx
    const tx = new Tx(rawTx)

    console.log(chalk.yellow('signing tx...'))
    // use library to sign tx using private key
    tx.sign(privateKey)
    // serialize tx in order to turn into payload for tx
    const serializedTx = tx.serialize()

    console.log(chalk.yellow('sending the tx... this might take a few minutes...'))
    // add 0x as hex value once again and broadcast to network. resolves when tx mined
    const sentTx = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
    
    console.log(chalk.magenta(`tx ${sentTx.transactionHash} has executed successfully`))
    console.log(chalk.blue.underline(`https://rinkeby.etherscan.io/tx/${sentTx.transactionHash}`))
  } catch (err) {
    console.log(chalk.red(`🔥  An error has occured: ${err}`))
  }
}

// command line arguments using yargs...
yargs
  .usage('$0 <cmd> [args]')
  .command(
    'create [location] [password]',
    'create account',
    yargs => {
      yargs.positional('location', {
        type: 'string',
        default: 'account.json',
        describe: 'the location to save the account'
      })
      yargs.positional('password', {
        type: 'string',
        describe: 'password for encrypting account private key',
        demandOption: true
      })
    },
    argv => {
      createAccount(argv)
    })
    .command(
      'decrypt [location] [password]',
      'decrypt account',
      yargs => {
        yargs.positional('location', {
          type: 'string',
          default: 'account.json',
          describe: 'the location of the encrypted account to decrypt'
        })
        yargs.positional('password', {
          type: 'string',
          describe: 'password for the encrypted account',
          demandOption: true
        })
      },
      argv => {
        decryptAccount(argv)
      }
    )
    .command(
      'transfer [location] [password] [receiver]', 
      'transfer NoobCoin to an address (requires eth balance for gas costs)',
      yargs => {
        yargs.positional(
          'location', {
          type: 'string',
          default: 'account.json',
          describe: 'the location of the encrypted account'
        })
        yargs.positional(
          'password', {
          type: 'string',
          describe: 'password for the encrypted account',
          demandOption: true
        })
        yargs.positional(
          'receiver', {
            type: 'string',
            describe: 'address to receive NoobCoin',
            default: '0x3aC7c51D964b4afc2FbCeC3C3Ac1b731FB7ECed0'
        })
        yargs.positional(
          'amount', {
            type: 'integer',
            describe: 'amount of NoobCoin in wei units to send (max starting balance is 100e18)',
            default: 1e18
        })
      },
      argv => {
        transferNoobCoin(argv)
      }
    )
  .help()
  .argv