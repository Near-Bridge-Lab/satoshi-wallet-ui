import { useWalletStore } from '@/stores/wallet';
import { generateUrl } from '@/utils/common';
import request from '@/utils/request';

export interface RawTransaction {
  Id: number;
  Status: number;
  GasLimit: string;
  GasToken: string;
  Csna: string;
  NearHash: string;
  NearRegisterHash: string;
  GasCostToken: string;
  GasCostNear: string;
  CreateTime: number;
  UpdateTime: number;
}

export const transactionServices = {
  async btcTxsHistory({ page = 1, pageSize = 10 }: { page?: number; pageSize?: number }) {
    const btcPubKey = useWalletStore.getState().originalPublicKey;
    const { result_data } = await request<{ result_data: RawTransaction[] }>(
      generateUrl(`${process.env.NEXT_PUBLIC_API_URL}/v1/btcTxsHistory`, {
        btcPubKey,
        page,
        pageSize,
      }),
    );
    return result_data;
  },
};
