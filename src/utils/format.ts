import Big from 'big.js';

export function formatSortAddress(address: string | undefined) {
  if (!address) return '';

  const domainSuffixes = ['.near', '.testnet', '.betanet', '.mainnet'];
  const maxLength = 20;

  const suffix = domainSuffixes.find((suffix) => address.endsWith(suffix));
  const isLongAddress = address.length > maxLength;

  if (suffix) {
    if (isLongAddress) {
      const visiblePartLength = maxLength - suffix.length - 10;
      if (visiblePartLength > 0) {
        return `${address.slice(0, 6)}...${address.slice(
          -4 - suffix.length,
          -suffix.length,
        )}${suffix}`;
      } else {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
      }
    } else {
      return address;
    }
  } else {
    return isLongAddress ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
  }
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

export function formatFileUrl(key: string, options?: { useS3Url: boolean }) {
  return `${
    options?.useS3Url
      ? process.env.NEXT_PUBLIC_AWS_S3_ORIGIN_URL
      : process.env.NEXT_PUBLIC_AWS_S3_URL
  }${key}`;
}
