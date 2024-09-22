import { create, StoreApi } from 'zustand';
import { getUrlQuery, storageStore } from '@/utils/common';
import { TOKEN_WHITE_LIST } from '@/config';
import { nearServices } from '@/services/near';
import { isEqual } from 'lodash-es';

const query = getUrlQuery();
const storage = storageStore(query.publicKey);

export type WalletState = {
  accountId?: string;
  tokens?: string[];
  addToken: (token: string) => void;
  hiddenTokens?: string[];
  setHiddenTokens?: (hiddenTokens: string[]) => void;
  displayableTokens?: string[];
  tokenMeta: Record<string, TokenMetadata | undefined>;
  setTokenMeta: (tokenMeta: Record<string, TokenMetadata | undefined>) => void;
};

export const useWalletStore = create<WalletState>((set, get) => ({
  accountId: 'jimi1.testnet',
  tokens: storage?.get('tokens') || TOKEN_WHITE_LIST,
  hiddenTokens: storage?.get('hiddenTokens') || [],
  tokenMeta: storage?.get('tokenMeta') || {},
  addToken: (token) => {
    const tokens = get().tokens;
    if (!tokens?.includes(token)) {
      const updatedTokens = [...(tokens || []), token];
      set({ tokens: updatedTokens });
      storage?.set('tokens', updatedTokens);
      setDisplayableTokens();
    }
  },
  setHiddenTokens: (hiddenTokens) => {
    storage?.set('hiddenTokens', hiddenTokens);
    set({ hiddenTokens });
    setDisplayableTokens();
  },
  displayableTokens: (storage?.get<string[]>('tokens') || TOKEN_WHITE_LIST).filter(
    (token) => !storage?.get<string[]>('hiddenTokens')?.includes(token),
  ),
  setTokenMeta: (tokenMeta) => {
    const mergedTokenMeta = { ...get().tokenMeta, ...tokenMeta };
    storage?.set('tokenMeta', mergedTokenMeta);
    set({ tokenMeta: mergedTokenMeta });
  },
}));

function subscribeTokensChange(store: StoreApi<WalletState>) {
  const initState = store.getState();
  initState.tokens?.length &&
    queryTokenMetadata(initState.tokens)?.then((tokenMeta) => {
      initState.setTokenMeta(tokenMeta || {});
    });

  store.subscribe(async (state, prevState) => {
    if (state.tokens && !isEqual(state.tokens, prevState.tokens)) {
      const tokenMeta = await queryTokenMetadata(state.tokens);
      state.setTokenMeta(tokenMeta || {});
      setDisplayableTokens();
    }
  });
}

function setDisplayableTokens() {
  const { tokens, hiddenTokens } = useWalletStore.getState();
  const displayableTokens = tokens?.filter((token) => !hiddenTokens?.includes(token));
  useWalletStore.setState({ displayableTokens });
}

function queryTokenMetadata(tokens: string[]) {
  try {
    const unFetchedTokens = tokens?.filter(
      (token) => !useWalletStore.getState().tokenMeta?.[token],
    );
    return nearServices.queryTokenMetadata(unFetchedTokens);
  } catch (error) {}
}

subscribeTokensChange(useWalletStore);
