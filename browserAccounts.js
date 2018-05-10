// web3 used for communicating with blockchain from js
import Web3 from 'web3'
// library for creating raw transactions
import Tx from  'ethereumjs-tx'
// library for handling big numbers due to js limitations
import BigNumber from 'bignumber.js'

// previous project smart contract on rinkeby testnet. All addresses start with 100e18 NoobCoin tokens
const noobCoinAddress = '0xd682fedb50f8d895c940bcac39472b0fd10966ab'
// put your own infura API key here if you want... though it should not be needed
const infuraKey = null;
// setup web3 to use infura node using rinkeby testnet
const web3 = new Web3(`https://rinkeby.infura.io/${infuraKey}`)
// contract definition used in order to "talk" to it
import NoobCoin from './NoobCoin'
// instantiate contract using definition at address
const noobCoin = new web3.eth.Contract(NoobCoin, noobCoinAddress)

// creates an account and saves the encrypted privateKey to disk
const createAccount = (password) => {
  const account = web3.eth.accounts.create()
  console.log('Wrote encrypted account to local storage. Use decrypt to access later.')
  // encrypt the newly created account private key using given password
  const encryptedAccount = web3.eth.accounts.encrypt(account.privateKey, password)
  localStorage.setItem('encryptedWallet', JSON.stringify(encryptedAccount))

  return encryptedAccount
}

// decrypts an encrypted private key at a given location using given password
const decryptAccount = (password, quiet) => {
  const encryptedAccount = JSON.parse(localStorage.getItem('encryptedWallet'))
  const account = web3.eth.accounts.decrypt(encryptedAccount, password)
  if (!quiet) {
    console.log('account decrypted: ')
    const {
      address,
      privateKey,
    } = account
    console.log(`address: ${address}`)
    console.log(`privateKey: ${privateKey}`)
  }
  return account
}

// sends preAllocated NoobCoin to hardcoded address using encrypted account
const transferNoobCoin = async (password, receiver, amount) => {
  console.log('attempting to transfer using NoobCoin contract (please be patient): ')
  console.log(
    'https://rinkeby.etherscan.io/address/0xd682fedb50f8d895c940bcac39472b0fd10966ab'
  )

  try {
    console.log('gathering data for tx...')
    // get decrypted account
    const account = decryptAccount(password, true)
    // ethereumjs-tx requires private key to be a buffer, also needs to NOT have 0x prepended
    const privateKey = new Buffer(account.privateKey.replace('0x', ''), 'hex')
    // get the data that goes in a tx for this contract method given the args used
    const data = noobCoin.methods.transfer(receiver, amount).encodeABI()
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

    console.log('creating the tx...')
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

    console.log('signing tx...')
    // use library to sign tx using private key
    tx.sign(privateKey)
    // serialize tx in order to turn into payload for tx
    const serializedTx = tx.serialize()

    console.log('sending the tx... this might take a few minutes...')
    // add 0x as hex value once again and broadcast to network. resolves when tx mined
    const sentTx = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))

    console.log(`tx ${sentTx.transactionHash} has executed successfully`)
    console.log(`https://rinkeby.etherscan.io/tx/${sentTx.transactionHash}`)

    return sentTx
  } catch (err) {
    console.error(`🔥  An error has occured: ${err}`)

    return err
  }
}

const getBalance = async address => {
  const balance = new BigNumber(await noobCoin.methods.balanceOf(address).call())

  console.log(`the token balance in wei units is: ${balance.toString()}`)
  console.log(`the balance in ether units is: ${balance.div('1e18').toString()}`)

  return balance
}

window.createAccount = createAccount
window.decryptAccount = decryptAccount
window.transferNoobCoin = transferNoobCoin
window.getBalance = getBalance