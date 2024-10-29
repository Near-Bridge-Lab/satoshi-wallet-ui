import { create } from 'zustand';

export type WalletState = {
  accountId?: string;
  originalAccountId?: string;
  originalPublicKey?: string;
};

export const useWalletStore = create<WalletState>((set, get) => ({
  accountId: '',
  originalAccountId: '',
  originalPublicKey: '',
}));

if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    console.log('event.origin', event.origin, event.data?.action);
    if (event.origin !== window.location.origin) {
      console.warn('Untrusted message origin:', event.origin);
      return;
    }
    const { action, data, error, success } = event.data;
    if (action === 'initializeData') {
      useWalletStore.setState({
        accountId: data.accountId,
        originalAccountId: data.originalAccountId,
        originalPublicKey: data.originalPublicKey,
      });
    }
  });
}
