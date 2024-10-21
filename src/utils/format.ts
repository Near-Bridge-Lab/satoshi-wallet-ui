import Big from 'big.js';

export function formatSortAddress(address: string | undefined) {
  if (!address) return '';
  const maxLength = 15;

  if (address.length <= maxLength) {
    return address;
  }
  return `${address.slice(0, 5)}...${address.slice(-5)}`;
}

export function formatNumber(val: string | number | undefined, options?: Intl.NumberFormatOptions) {
  if (!val) return 0;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
    ...options,
  }).format(Number(val));
}

export function formatAmount(amount: string | number | undefined, decimals = 24) {
  if (!amount) return '';
  try {
    const n = new Big(amount).div(Big(10).pow(decimals)).toFixed();
    return n;
  } catch (error) {
    return '';
  }
}

export function formatFileUrl(key: string) {
  return `${process.env.NEXT_PUBLIC_AWS_S3_URL}${key}`;
}

export function formatToken(symbol?: string) {
  if (symbol === 'NBTC') return 'BTC';
  return symbol;
}

export function parseAmount(amount: string | number | undefined, decimals = 24) {
  if (!amount) return '';
  try {
    return new Big(amount).times(Big(10).pow(decimals)).toFixed(0, Big.roundDown);
  } catch (error) {
    return '';
  }
}

export function formatExplorerUrl(val: string, type: 'account' | 'transaction' = 'transaction') {
  return (
    (process.env.NEXT_PUBLIC_NETWORK === 'mainnet'
      ? 'https://nearblocks.io'
      : 'https://testnet.nearblocks.io') + `/${type === 'account' ? 'address' : 'txns'}/${val}`
  );
}
