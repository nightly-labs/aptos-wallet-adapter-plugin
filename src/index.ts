import {
  AptosWalletErrorResult,
  NetworkName,
  PluginProvider,
} from '@aptos-labs/wallet-adapter-core'
import type {
  AccountInfo,
  AdapterPlugin,
  NetworkInfo,
  SignMessagePayload,
  SignMessageResponse,
  WalletName,
} from '@aptos-labs/wallet-adapter-core'
import { Types } from 'aptos'
import { AptosPublicKey } from './aptos_public_key'
import { PendingTransaction, TransactionPayload } from 'aptos/src/generated'
import { nightlyIcon } from './icon'
interface AptosNightly {
  publicKey: AptosPublicKey
  onAccountChange: (pubKey?: string) => void
  connect(onDisconnect?: () => void, eagerConnect?: boolean): Promise<AptosPublicKey>
  disconnect(): Promise<void>
  signTransaction: (
    transaction: TransactionPayload,
    submit: boolean
  ) => Promise<Uint8Array | PendingTransaction>
  signAllTransactions: (transaction: TransactionPayload[]) => Promise<Uint8Array[]>
  signMessage(msg: string): Promise<Uint8Array>
  network(): Promise<{ api: string; chainId: number; network: string }>
}
interface NightlyWindow extends Window {
  nightly?: {
    aptos: AptosNightly
  }
}

declare const window: NightlyWindow // CHANGE AptosWindow

export const NightlyWalletName = 'Nightly' as WalletName<'Nightly'> // CHANGE AptosWalletName, CHANGE "Aptos"

// CHANGE AptosWallet
export class NightlyWallet implements AdapterPlugin {
  readonly name = NightlyWalletName // CHANGE AptosWalletName (can have capitalization)
  readonly url = // CHANGE url value
    'https://chrome.google.com/webstore/detail/nightly/fiikommddbeccaoicoejoniammnalkfa'
  readonly icon = nightlyIcon

  // An optional property for wallets which may have different wallet name with window property name.
  // such as window.aptosWallet and wallet name is Aptos.
  // If your wallet name prop is different than the window property name use the window property name here and comment out line 37

  readonly providerName = 'nightly'

  provider: AptosNightly | undefined =
    typeof window !== 'undefined' ? window.nightly?.aptos : undefined // CHANGE window.aptos

  async connect(): Promise<AccountInfo> {
    try {
      const accountInfo = await this.provider?.connect()
      if (!accountInfo) throw `${NightlyWalletName} Address Info Error`
      return {
        address: accountInfo.address(),
        publicKey: accountInfo.asString(),
      }
    } catch (error: any) {
      throw error
    }
  }

  async account(): Promise<AccountInfo> {
    const response = await this.provider?.publicKey
    if (!response) throw `${NightlyWalletName} Account Error`
    return {
      address: response.address(),
      publicKey: response.asString(),
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.provider?.disconnect()
    } catch (error: any) {
      throw error
    }
  }

  async signAndSubmitTransaction(
    transaction: Types.TransactionPayload,
    options?: any
  ): Promise<{ hash: Types.HexEncodedBytes }> {
    try {
      const response = await this.provider?.signTransaction(transaction, true)
      if (response) throw `${NightlyWalletName} signAndSubmitTransaction Error`

      return { hash: (response as unknown as Uint8Array).toString() }
    } catch (error: any) {
      const errMsg = error.message
      throw errMsg
    }
  }

  async signMessage(message: SignMessagePayload): Promise<SignMessageResponse> {
    try {
      if (typeof message !== 'object' || !message.nonce) {
        ;`${NightlyWalletName} Invalid signMessage Payload`
      }
      // TODO: use nonce and prefix
      const response = await this.provider?.signMessage(message.message)
      if (response) {
        return {
          fullMessage: message.message,
          signature: response.toString(),
          message: message.message,
          nonce: message.nonce,
          prefix: 'APTOS',
        }
      } else {
        throw `${NightlyWalletName} Sign Message failed`
      }
    } catch (error: any) {
      const errMsg = error.message
      throw errMsg
    }
  }

  async network(): Promise<NetworkInfo> {
    try {
      const response = await this.provider?.network()
      if (!response) throw `${NightlyWalletName} Network Error`
      return {
        name: response.network.toLocaleLowerCase() as NetworkName,
      }
    } catch (error: any) {
      throw error
    }
  }
  // TODO: implement this
  async onNetworkChange(callback: any): Promise<void> {
    try {
      throw 'Not implemented'
    } catch (error: any) {
      const errMsg = error.message
      throw errMsg
    }
  }

  async onAccountChange(callback: any): Promise<void> {
    try {
      const handleAccountChange = async (newAccount: AccountInfo): Promise<void> => {
        if (newAccount?.publicKey) {
          callback({
            publicKey: newAccount.publicKey,
            address: newAccount.address,
          })
        } else {
          const response = await this.connect()
          callback({
            address: response?.address,
            publicKey: response?.publicKey,
          })
        }
      }
      if (this.provider) {
        this.provider.onAccountChange = (pubKey) => {
          if (!pubKey) throw `${NightlyWalletName} onAccountChange Error`
          const publicKey = AptosPublicKey.fromBase58(pubKey)
          handleAccountChange({ address: publicKey.address(), publicKey: publicKey.asString() })
        }
      } else {
        throw `${NightlyWalletName} onAccountChange Error`
      }
    } catch (error: any) {
      console.log(error)
      const errMsg = error.message
      throw errMsg
    }
  }
}
