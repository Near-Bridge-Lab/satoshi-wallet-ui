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

function updateFromUrl() {
  const query = getUrlQuery();
  useWalletStore.setState({
    accountId: query.accountId,
    originalAccountId: query.originalAccountId,
    originalPublicKey: query.originalPublicKey,
  });
  if (!query.originalPublicKey) {
    setTimeout(updateFromUrl, 5000);
  }
}

updateFromUrl();
