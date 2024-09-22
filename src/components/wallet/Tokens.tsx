'use client';
import { NEAR_TOKEN_CONTRACT } from '@/config';
import { useDebouncedMemo, useRequest } from '@/hooks/useHooks';
import { nearServices } from '@/services/near';
import { usePriceStore } from '@/stores/price';
import { useWalletStore } from '@/stores/wallet';
import { formatNumber } from '@/utils/format';
import { isValidNearAddress } from '@/utils/validate';
import { Button, Image, Input } from '@nextui-org/react';
import Big from 'big.js';
import { useEffect, useMemo, useState } from 'react';
import Loading from '../basic/Loading';
import { Icon } from '@iconify/react/dist/iconify.js';
import { useRouter } from 'next/navigation';
import { useMessageBoxContext } from '@/providers/MessageBoxProvider';
import { debounce } from 'lodash-es';

export function Tokens({
  mode,
  search,
  onClick,
}: {
  mode?: 'select' | 'manage';
  search?: string;
  onClick?: (token: string) => void;
}) {
  const { displayableTokens = [], tokenMeta } = useWalletStore();
  const { prices } = usePriceStore();

  const filteredTokens = useDebouncedMemo(
    async () =>
      displayableTokens.filter((token) => {
        if (!search) return true;
        const meta = tokenMeta[token];
        return (
          token.toLowerCase().includes(search.toLowerCase()) ||
          meta?.symbol.toLowerCase().includes(search.toLowerCase())
        );
      }),
    [displayableTokens, search, tokenMeta],
    500,
  );

  const { data: balances } = useRequest(
    async () => {
      const res = await Promise.all(
        displayableTokens.map((token) => nearServices.getBalance(token)),
      );
      return res.reduce(
        (acc, balance, index) => {
          acc[displayableTokens[index]] = balance;
          return acc;
        },
        {} as Record<string, string>,
      );
    },
    { pollingInterval: 30000 },
  );

  const balancesUSD = useMemo(() => {
    return displayableTokens.reduce(
      (acc, token) => {
        const symbol = tokenMeta[token]?.symbol;
        if (!symbol) return acc;
        acc[token] = new Big(prices?.[symbol] || 0).times(balances?.[token] || 0).toNumber();
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [balances, prices, tokenMeta, displayableTokens]);

  const sortedTokens = useMemo(() => {
    return filteredTokens?.sort((a, b) => {
      // if near is the first token
      if (a === NEAR_TOKEN_CONTRACT) return -1;
      if (b === NEAR_TOKEN_CONTRACT) return 1;
      return new Big(balancesUSD?.[b] || 0).minus(balancesUSD?.[a] || 0).toNumber();
    });
  }, [balancesUSD, filteredTokens]);

  return (
    <div className={`flex flex-col ${mode === 'select' ? 'gap-1' : 'gap-4'}`}>
      {sortedTokens?.map((token, index) => (
        <div
          key={index}
          className={`card cursor-pointer text-sm ${mode === 'select' ? 'bg-transparent' : ''}`}
          onClick={() => onClick?.(token)}
        >
          <div className="flex items-center gap-2">
            <Image src={tokenMeta[token]?.icon} width={30} height={30} />
            <div>
              <div className="text-base font-bold">{tokenMeta[token]?.symbol}</div>
              <div className="text-xs text-default-500">
                {tokenMeta[token]?.symbol
                  ? formatNumber(prices?.[tokenMeta[token]?.symbol], {
                      style: 'currency',
                      currency: 'USD',
                    })
                  : '-'}
              </div>
            </div>
          </div>
          <div>
            <div className="text-base font-bold text-right">{formatNumber(balances?.[token])}</div>
            <div className="text-xs text-default-500 text-right">
              {formatNumber(balancesUSD?.[token], { style: 'currency', currency: 'USD' })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ImportToken({ onSuccess }: { onSuccess?: () => void }) {
  const { addToken } = useWalletStore();
  const [address, setAddress] = useState('');

  const { data: tokenMeta, loading } = useRequest(
    async () => {
      if (!isValidNearAddress(address)) return;
      const tokenMeta = await nearServices.queryTokenMetadata(address);
      return tokenMeta;
    },
    {
      refreshDeps: [address],
      debounceOptions: 100,
    },
  );

  function handleImport() {
    if (!address || !tokenMeta) return;
    addToken(address);
    setAddress('');
    onSuccess?.();
  }

  function handlePaste() {
    navigator.clipboard.readText().then((text) => {
      setAddress(text);
    });
  }

  return (
    <div className="flex flex-col gap-8 pb-3">
      <div>
        <Input
          placeholder="Token Address"
          size="lg"
          value={address}
          endContent={
            loading ? (
              <Loading className="flex items-center justify-center" size="sm" loading={true} />
            ) : !address ? (
              <div className="cursor-pointer" onClick={handlePaste}>
                <Icon icon="eva:clipboard-outline" />
              </div>
            ) : null
          }
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>
      {address && (
        <Loading loading={loading} className="w-full">
          {tokenMeta ? (
            <div className="card gap-2">
              <Image src={tokenMeta.icon} width={30} height={30} />
              <div className="flex-1 ml-1">
                <div className="text-base font-bold">{tokenMeta.symbol}</div>
                <div className="text-xs text-default-500">{tokenMeta.name}</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-default-500">Token not found</div>
          )}
        </Loading>
      )}
      <div>
        <Button
          color="primary"
          size="lg"
          onClick={handleImport}
          isLoading={loading}
          isDisabled={!address}
          fullWidth
        >
          Import
        </Button>
      </div>
    </div>
  );
}

export function useTokenSelector() {
  const { openModal } = useMessageBoxContext();
  async function open({ value }: { value?: string }) {
    return new Promise<string | undefined>((resolve) => {
      openModal({
        header: 'Select Token',
        body: ({ close }) => (
          <TokenSelector
            value={value}
            onChange={(v) => {
              close?.();
              resolve?.(v);
            }}
          />
        ),
        placement: 'bottom',
        size: 'full',
      });
    });
  }
  return { open };
}

export function TokenSelector({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value?: string) => void;
}) {
  const [search, setSearch] = useState('');

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Input
          placeholder="Search Tokens"
          size="lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Tokens mode="select" search={search} onClick={(v) => onChange(v)} />
    </div>
  );
}
