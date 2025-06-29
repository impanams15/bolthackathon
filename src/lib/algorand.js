import algosdk from 'algosdk'

// Algorand configuration
const ALGORAND_CONFIG = {
  testnet: {
    server: 'https://testnet-api.algonode.cloud',
    port: '',
    token: ''
  },
  mainnet: {
    server: 'https://mainnet-api.algonode.cloud',
    port: '',
    token: ''
  }
}

// Use testnet by default
const isMainnet = import.meta.env.VITE_ALGORAND_NETWORK === 'mainnet'
const config = isMainnet ? ALGORAND_CONFIG.mainnet : ALGORAND_CONFIG.testnet

export const algodClient = new algosdk.Algodv2(config.token, config.server, config.port)

// Helper functions
export const generateAccount = () => {
  const account = algosdk.generateAccount()
  return {
    address: account.addr,
    privateKey: algosdk.secretKeyToMnemonic(account.sk),
    publicKey: Buffer.from(account.sk.slice(32)).toString('hex')
  }
}

export const getAccountFromMnemonic = (mnemonic) => {
  try {
    const account = algosdk.mnemonicToSecretKey(mnemonic)
    return {
      address: account.addr,
      privateKey: account.sk,
      publicKey: Buffer.from(account.sk.slice(32)).toString('hex')
    }
  } catch (error) {
    throw new Error('Invalid mnemonic phrase')
  }
}

export const getAccountInfo = async (address) => {
  try {
    const accountInfo = await algodClient.accountInformation(address).do()
    return accountInfo
  } catch (error) {
    throw new Error(`Failed to get account info: ${error.message}`)
  }
}

export const formatAlgoAmount = (microAlgos) => {
  return (microAlgos / 1000000).toFixed(6)
}

export const microAlgosFromAlgos = (algos) => {
  return Math.round(algos * 1000000)
}