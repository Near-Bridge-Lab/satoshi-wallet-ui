import { create, StoreApi } from 'zustand';
import { priceServices } from '@/services/price';

export type PriceState = {
  prices: Record<string, string>;
};

export const usePriceStore = create<PriceState>((set, get) => ({
  prices: {},
}));

function pollingQueryPrice(store: StoreApi<PriceState>) {
  priceServices.queryPrices().then((prices) => {
    store.setState({ prices });
  });
  setTimeout(() => pollingQueryPrice(store), 60000);
}

pollingQueryPrice(usePriceStore);
