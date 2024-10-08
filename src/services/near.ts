import { NEAR_RPC_NODES, NEAR_TOKEN_CONTRACT } from '@/config';
import { useTokenStore } from '@/stores/token';
import { useWalletStore } from '@/stores/wallet';
import { formatAmount, formatFileUrl } from '@/utils/format';
import { connect, keyStores, Near, providers } from 'near-api-js';
import { QueryResponseKind } from 'near-api-js/lib/providers/provider';

export const nearServices = {
  getNearConnectionConfig(network = process.env.NEXT_PUBLIC_NETWORK) {
    const nodeUrl = Object.values(NEAR_RPC_NODES)[0];
    const jsonRpcProvider = Object.values(NEAR_RPC_NODES).map(
      (url) => new providers.JsonRpcProvider({ url }),
    );
    const provider = new providers.FailoverRpcProvider(jsonRpcProvider);
    return network === 'testnet'
      ? {
          networkId: 'testnet',
          keyStore: new keyStores.BrowserLocalStorageKeyStore(),
          nodeUrl,
          provider,
          walletUrl: 'https://testnet.mynearwallet.com',
          helperUrl: 'https://helper.testnet.near.org',
          explorerUrl: 'https://explorer.testnet.near.org',
          indexerUrl: 'https://testnet-api.kitwallet.app',
        }
      : {
          networkId: 'mainnet',
          keyStore: new keyStores.BrowserLocalStorageKeyStore(),
          nodeUrl,
          provider,
          walletUrl: 'https://app.mynearwallet.com',
          helperUrl: 'https://helper.mainnet.near.org',
          explorerUrl: 'https://explorer.mainnet.near.org',
          indexerUrl: 'https://api.kitwallet.app',
        };
  },
  near: {} as Record<NetworkId, Near>,
  async nearConnect(network = process.env.NEXT_PUBLIC_NETWORK) {
    if (this.near[network]) return this.near[network];
    const near = await connect(this.getNearConnectionConfig(network));
    this.near[network] = near;
    return near;
  },
  async query<T = any>({
    contractId,
    method,
    args = {},
    network,
  }: {
    contractId: string;
    method: string;
    args?: any;
    gas?: string;
    deposit?: string;
    network?: NetworkId;
  }) {
    try {
      if (typeof window === 'undefined') return;
      const { connection } = await this.nearConnect(network);
      // console.log(`${method} args`, args);
      const res = await connection.provider.query({
        request_type: 'call_function',
        account_id: contractId,
        method_name: method,
        args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
        finality: 'final',
      });
      const result = JSON.parse(
        Buffer.from((res as QueryResponseKind & { result: number[] }).result).toString(),
      ) as T;
      // console.log(`${method} result`, result);
      return result;
    } catch (error) {
      console.error(`${method} error`, error);
    }
  },
  async queryTokenMetadata<T extends string | string[]>(token: T) {
    if (!token?.length) return;
    const tokenArr = Array.isArray(token) ? token : [token];
    const res = await Promise.allSettled(
      tokenArr.map((token) =>
        this.query<TokenMetadata>({ contractId: token, method: 'ft_metadata' }),
      ),
    );
    const tokenMeta = res.reduce(
      (acc, token, index) => {
        if (token.status === 'fulfilled' && token.value) {
          const tokenMeta = token.value;
          if (tokenMeta.symbol === 'wNEAR') {
            tokenMeta.symbol = 'NEAR';
            tokenMeta.icon = formatFileUrl('/assets/crypto/near.svg');
          }
          acc[tokenArr[index]] = tokenMeta;
        }
        return acc;
      },
      {} as Record<string, TokenMetadata>,
    );
    if (typeof token === 'string') {
      return tokenMeta[token] as T extends string ? TokenMetadata | undefined : never;
    }
    return (Object.keys(tokenMeta).length ? tokenMeta : undefined) as T extends string
      ? TokenMetadata | undefined
      : Record<string, TokenMetadata> | undefined;
  },
  async getNearAccountId() {
    return useWalletStore.getState().accountId;
  },
  /** get balance, if tokenAddress is undefined, get NEAR balance */
  async getBalance(address: string) {
    try {
      const { accountId } = useWalletStore.getState();
      const { tokenMeta } = useTokenStore.getState();
      if (!address || !accountId) return '0';
      const near = await this.nearConnect();
      const account = await near.account(accountId);
      let balance = '0';
      if (address === NEAR_TOKEN_CONTRACT) {
        balance = (await account.getAccountBalance()).available;
      } else {
        balance =
          (await this.query<string>({
            contractId: address,
            method: 'ft_balance_of',
            args: { account_id: accountId },
          })) || '0';
      }
      let decimals = tokenMeta[address]?.decimals;
      if (!decimals) {
        const res = await this.queryTokenMetadata(address);
        decimals = res?.decimals;
      }
      return formatAmount(balance, decimals);
    } catch (error) {
      console.error(error);
      return '0';
    }
  },
};
