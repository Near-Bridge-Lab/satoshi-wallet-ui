import type {
  InjectedWallet,
  WalletModuleFactory,
  WalletBehaviourFactory,
} from '@near-wallet-selector/core';
import { providers, transactions } from 'near-api-js';
import { AccessKeyViewRaw, AccountView } from 'near-api-js/lib/providers/provider';
import { Action, actionCreators } from '@near-js/transactions';
import { KeyType, PublicKey } from 'near-api-js/lib/utils/key_pair';
import {
  createTransaction,
  encodeDelegateAction,
  encodeTransaction,
  Signature,
} from 'near-api-js/lib/transaction';
import { baseDecode, baseEncode } from '@near-js/utils';
import { nearServices } from '@/services/near';

const CONTRACT_ID = 'dev0.btc-bridge.testnet';

const { signedDelegate, transfer, functionCall } = actionCreators;
interface CAWalletParams {
  iconUrl?: string;
  deprecated?: boolean;
}
const state: any = {
  saveAccount(account: string) {
    window.localStorage.setItem('ca-account', account);
  },
  removeAccount() {
    window.localStorage.removeItem('ca-account');
  },
  savePublicKey(publicKey: string) {
    window.localStorage.setItem('ca-publickey', publicKey);
  },
  removePublicKey() {
    window.localStorage.removeItem('ca-publickey');
  },
  clear() {
    this.removeAccount();
    this.removePublicKey();
  },
  save(account: string, publicKey: string) {
    this.saveAccount(account);
    this.savePublicKey(publicKey);
  },
  getAccount() {
    return window.localStorage.getItem('ca-account');
  },
  getPublicKey() {
    return window.localStorage.getItem('ca-publickey');
  },
};
const CAWallet: WalletBehaviourFactory<InjectedWallet> = async ({
  metadata,
  store,
  emitter,
  logger,
  id,
  provider,
}) => {
  const signIn = async ({ contractId, methodNames }: any) => {
    // console.log(contractId, methodNames)
    const btcPublicKey = (metadata as any).getBtcPublicKey();
    console.log('btcPublicKey:', btcPublicKey);
    const nearTempAddress = await nearServices.query({
      contractId: CONTRACT_ID,
      method: 'get_chain_signature_near_account',
      args: { btc_public_key: btcPublicKey },
    });
    const nearTempPublicKey = await nearServices.query({
      contractId: CONTRACT_ID,
      method: 'get_chain_signature_near_account_public_key',
      args: { btc_public_key: btcPublicKey },
    });
    console.log(nearTempPublicKey);
    state.save(nearTempAddress, nearTempPublicKey);
    return [
      {
        accountId: nearTempAddress,
        publicKey: nearTempPublicKey,
      },
    ];
  };
  const signOut = async () => {
    state.clear();
    window.localStorage.removeItem('near-wallet-selector:selectedWalletId');
  };
  const getAccounts = async () => {
    return [{ accountId: state.getAccount() }];
  };
  return {
    signIn,
    signOut,
    getAccounts,
    async verifyOwner() {
      throw new Error(`Method not supported by ${metadata.name}`);
    },
    async signMessage() {
      throw new Error(`Method not supported by ${metadata.name}`);
    },
    async signAndSendTransaction({
      receiverId,
      actions,
    }: {
      receiverId: string;
      actions: Array<Action>;
    }) {
      const { header } = await provider.block({ finality: 'final' });
      const accountId = state.getAccount();
      const publicKey = state.getPublicKey();
      const rawAccessKey = await provider.query<AccessKeyViewRaw>({
        request_type: 'view_access_key',
        account_id: accountId,
        public_key: publicKey,
        finality: 'final',
      });
      const accessKey = {
        ...rawAccessKey,
        nonce: BigInt(rawAccessKey.nonce || 0),
      };
      console.log('accessKey:', accountId, publicKey, accessKey);
      const publicKeyFromat = PublicKey.from(publicKey);
      const transaction = actions[0];
      // console.log('transaction:', functionCall(transaction.params.methodName, transaction.params.args, transaction.params.gas, transaction.params.deposit))
      console.log('222', accessKey.nonce + BigInt(1));
      const _transiton: any = await transactions.createTransaction(
        accountId,
        publicKeyFromat,
        receiverId as string,
        Number(accessKey.nonce + BigInt(1)),
        // 0,
        [
          functionCall(
            transaction.params.methodName,
            transaction.params.args,
            transaction.params.gas,
            transaction.params.deposit,
          ),
        ],
        baseDecode(header.hash),
      );
      console.log('_transiton:', _transiton);
      let tx_bytes = encodeTransaction(_transiton);
      const btcPublicKey = (metadata as any).getBtcPublicKey();
      const accountInfo = await nearServices.query({
        contractId: CONTRACT_ID,
        method: 'get_account',
        args: { account_id: accountId },
      });
      console.log('accountInfo:', accountInfo);
      return {
        near_transactions: Array.from(tx_bytes),
        nonce: accountInfo.nonce,
        // nonce:0,
        chain_id: 397,
        csna: accountId,
        btcPublicKey,
        nearPublicKey: publicKey,
      } as any;
    },
    async signAndSendTransactions({ transactions }) {
      return [];
    },
  };
};
let btc: any = 1,
  btcBalance = 0;
export function setupCA({
  iconUrl = 'https://www.thefaucet.org/images/logo.jpg',
  deprecated = false,
}: CAWalletParams = {}): WalletModuleFactory<InjectedWallet> {
  const ca: any = async () => {
    return {
      id: 'ca-wallet',
      type: 'injected',
      metadata: {
        name: 'CA',
        description: 'CA',
        iconUrl,
        downloadUrl: iconUrl,
        deprecated,
        available: true,
        getBtcPublicKey: () => {
          return btc;
        },
        getBtcBalance: () => {
          return btcBalance;
        },
      },
      init: CAWallet,
    };
  };
  ca.updateBtcPublickKey = (btcPublicKey: string) => {
    btc = btcPublicKey;
  };
  ca.updateBtcBalance = (balance: number) => {
    btcBalance = balance;
  };
  return ca;
}
