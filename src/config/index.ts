export const IS_MAINNET = process.env.NEXT_PUBLIC_NETWORK === 'mainnet';

export const NEAR_TOKEN_CONTRACT = IS_MAINNET ? 'wrap.near' : 'wrap.testnet';

export const TOKEN_WHITE_LIST = IS_MAINNET
  ? [
      '2260fac5e5542a773aa44fbcfedf7c193bc2c599.factory.bridge.near',
      'wrap.near',
      'usdt.tether-token.near',
      '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
    ]
  : ['nbtc2-nsp.testnet', 'wrap.testnet', 'usdtt.fakes.testnet', 'deltausdc.testnet'];

export const MAIN_TOKEN = TOKEN_WHITE_LIST[0];

export const NEAR_RPC_NODES = IS_MAINNET
  ? {
      Official: 'https://rpc.mainnet.near.org',
      Lava: 'https://near.lava.build',
      Fastnear: 'https://free.rpc.fastnear.com',
      Drpc: 'https://near.drpc.org',
    }
  : {
      Official: 'https://rpc.testnet.near.org',
      Lava: 'https://near-testnet.lava.build',
      Drpc: 'https://near-testnet.drpc.org',
    };
