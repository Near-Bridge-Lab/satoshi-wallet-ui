export const IS_MAINNET = process.env.NEXT_PUBLIC_NETWORK === 'mainnet';

export const NEAR_TOKEN_CONTRACT = IS_MAINNET ? 'wrap.near' : 'wrap.testnet';

export const BTC_TOKEN_CONTRACT = IS_MAINNET
  ? '2260fac5e5542a773aa44fbcfedf7c193bc2c599.factory.bridge.near'
  : process.env.NEXT_PUBLIC_RUNTIME_ENV === 'test'
    ? 'nbtc2-nsp.testnet'
    : 'nbtc1-nsp.testnet';

export const TOKEN_WHITE_LIST = [
  BTC_TOKEN_CONTRACT,
  NEAR_TOKEN_CONTRACT,
  ...(IS_MAINNET
    ? ['17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1', 'usdt.tether-token.near']
    : ['deltausdc.testnet', 'usdtt.fakes.testnet']),
];

export const MAIN_TOKEN = BTC_TOKEN_CONTRACT;

export const NEAR_RPC_NODES = IS_MAINNET
  ? {
      Official: 'https://rpc.mainnet.near.org',
      Lava: 'https://near.lava.build',
      Fastnear: 'https://free.rpc.fastnear.com',
      Drpc: 'https://near.drpc.org',
    }
  : {
      Official: 'https://rpc.testnet.near.org',
      // Lava: 'https://near-testnet.lava.build',
      // Drpc: 'https://near-testnet.drpc.org',
    };
