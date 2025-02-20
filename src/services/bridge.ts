import { RUNTIME_NETWORK } from '@/config';
import { useWalletStore } from '@/stores/wallet';
import { formatAmount, formatFileUrl, parseAmount } from '@/utils/format';
import Big from 'big.js';
import { calculateWithdraw, getDepositAmount, calculateGasFee } from 'btc-wallet';

export const btcBridgeServices = {
  queryChains() {
    return [
      {
        chain: 'btc',
        name: 'BTC',
        icon: formatFileUrl(`/assets/chain/btc.svg`),
      },
      {
        chain: 'near',
        name: 'Near',
        icon: formatFileUrl(`/assets/chain/near.svg`),
      },
    ];
  },
  async estimate({ chain, amount }: { chain: string; amount: string }) {
    const { originalAccountId: btcAccount, accountId: nearAccount } = useWalletStore.getState();
    const time = '~20 Min';
    if (!btcAccount || !nearAccount || new Big(amount || 0).eq(0)) {
      return {
        time,
        gasFee: '0',
        protocolFee: '0',
        receiveAmount: '0',
      };
    }
    const btcDecimals = 8;
    const rawAmount = parseAmount(amount, btcDecimals);
    if (chain === 'btc') {
      const res = await getDepositAmount(rawAmount, { csna: nearAccount });
      const protocolFee = formatAmount(res.protocolFee, btcDecimals);
      const rawGasFee = await calculateGasFee(btcAccount, Number(rawAmount));
      const gasFee = formatAmount(rawGasFee, btcDecimals);
      return {
        time,
        gasFee,
        protocolFee,
        receiveAmount: amount,
      };
    } else {
      const res = await calculateWithdraw({
        amount: rawAmount,
        csna: nearAccount,
        btcAddress: btcAccount,
        env: RUNTIME_NETWORK,
      });
      console.log('calculateWithdraw', res);
      const gasFee = formatAmount(res.gasFee, btcDecimals);
      const protocolFee = formatAmount(res.withdrawFee, btcDecimals);
      const receiveAmount = formatAmount(res.receiveAmount, btcDecimals);
      console.log('receiveAmount', receiveAmount);
      console.log('gasFee', gasFee);
      console.log('protocolFee', protocolFee);
      return {
        time,
        gasFee,
        protocolFee,
        receiveAmount,
      };
    }
  },
};
