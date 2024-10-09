import { useWalletStore } from '@/stores/wallet';
import { generateUrl } from '@/utils/common';
import request from '@/utils/request';

export const transactionServices = {
  async btcTxsHistory({ page = 1, pageSize = 10 }: { page?: number; pageSize?: number }) {
    const btcPubKey = useWalletStore.getState().originalPublicKey;
    const { result_data } = await request<{ result_data: any[] }>(
      generateUrl(`${process.env.NEXT_PUBLIC_API_URL}/v1/btcTxsHistory`, {
        btcPubKey,
        page,
        pageSize,
      }),
    );
    return result_data;
  },
};
