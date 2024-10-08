import { create } from 'zustand';
import { getUrlQuery } from '@/utils/common';

const query = getUrlQuery();

export type WalletState = {
  accountId?: string;
  originalAccountId?: string;
  originalPublicKey?: string;
};

export const useWalletStore = create<WalletState>((set, get) => ({
  accountId: query.accountId,
  originalAccountId: query.originalAccountId,
  originalPublicKey: query.originalPublicKey,
}));
