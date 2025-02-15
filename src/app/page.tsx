'use client';
import Loading from '@/components/basic/Loading';
import ChainSelector from '@/components/wallet/Chains';
import DepositPrompt from '@/components/wallet/DepositPrompt';
import Tools from '@/components/wallet/Tools';
import { BTC_TOKEN_CONTRACT } from '@/config';
import { useClient } from '@/hooks/useHooks';
import { useTokenStore } from '@/stores/token';
import { useWalletStore } from '@/stores/wallet';

import {
  formatFileUrl,
  formatNumber,
  formatPrice,
  formatSortAddress,
  formatToken,
} from '@/utils/format';
import { Icon } from '@iconify/react';
import {
  Button,
  Image,
  Snippet,
  Tabs,
  Tab,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@nextui-org/react';
import Big from 'big.js';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

export default function Home() {
  return (
    <main className="s-container">
      <DepositPrompt />
      <Header className="mb-10" />
      <Balance className="mb-10" />
      <Tools className="mb-10" />
      <Portfolio />
    </main>
  );
}

function Header({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <header className={`flex justify-between w-full ${className ?? ''}`}>
      <ChainSelector />
      <Account />
      <Button
        isIconOnly
        variant="flat"
        size="sm"
        radius="full"
        className="min-w-7 w-7 h-7 bg-default-100"
        onClick={() => router.push('/settings')}
      >
        <Icon icon="fluent:settings-48-filled" className="text-lg" />
      </Button>
    </header>
  );
}

function Account() {
  const { accountId, originalAccountId } = useWalletStore();
  const { isClient } = useClient();
  return (
    isClient && (
      <div className="flex flex-col gap-2 items-center">
        <div className="font-bold">Near Account</div>
        <Popover>
          <PopoverTrigger>
            <div className="flex items-center gap-2 text-sm text-default-500 bg-foreground/10 h-6 px-2 rounded-full cursor-pointer">
              <div className="">{formatSortAddress(accountId)}</div>
              <Icon icon="fluent:chevron-right-12-regular" />
            </div>
          </PopoverTrigger>
          <PopoverContent>
            <div className="p-1 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-5">
                <Image src={formatFileUrl('/assets/chain/near.svg')} width={24} height={24} />
                <Snippet
                  classNames={{ base: 'bg-transparent p-0' }}
                  codeString={accountId}
                  hideSymbol
                >
                  {formatSortAddress(accountId)}
                </Snippet>
              </div>
              <div className="flex items-center justify-between gap-5">
                <Image src={formatFileUrl('/assets/chain/btc.svg')} width={24} height={24} />
                <Snippet
                  classNames={{ base: 'bg-transparent p-0' }}
                  codeString={originalAccountId}
                  hideSymbol
                >
                  {formatSortAddress(originalAccountId)}
                </Snippet>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    )
  );
}

function Balance({ className }: { className?: string }) {
  const { isClient } = useClient();
  const { balances, prices, tokenMeta } = useTokenStore();
  const balance = useMemo(() => balances?.[BTC_TOKEN_CONTRACT], [balances]);
  const balanceUSD = useMemo(
    () =>
      new Big(prices?.[tokenMeta[BTC_TOKEN_CONTRACT]?.symbol!] || 0).times(balance || 0).toNumber(),
    [balance, prices, tokenMeta],
  );

  return (
    isClient && (
      <div className={`flex flex-col items-center justify-center gap-2 ${className ?? ''}`}>
        <div className="text-4xl font-bold">
          {formatNumber(balance || 0)}{' '}
          <span>{formatToken(tokenMeta[BTC_TOKEN_CONTRACT]?.symbol)}</span>
        </div>
        <div className="text-default-500">≈ ${formatPrice(balanceUSD)}</div>
      </div>
    )
  );
}

const portfolios = [
  { label: 'Tokens', value: 'tokens' },
  { label: 'NFTs', value: 'nfts' },
  { label: 'Activity', value: 'activity' },
];

const Tokens = dynamic(() => import('@/components/wallet/Tokens').then((module) => module.Tokens), {
  loading: () => <Loading className="flex items-center justify-center min-h-[200px]" />,
  ssr: false,
});
const NFTs = dynamic(() => import('@/components/wallet/NTFs').then((module) => module.NFTs), {
  loading: () => <Loading className="flex items-center justify-center min-h-[200px]" />,
  ssr: false,
});
const Activity = dynamic(
  () => import('@/components/wallet/Activity').then((module) => module.default),
  {
    loading: () => <Loading className="flex items-center justify-center min-h-[200px]" />,
    ssr: false,
  },
);

function Portfolio({ className }: { className?: string }) {
  const router = useRouter();
  const [current, setCurrent] = useState(portfolios[0].value);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <Tabs
          aria-label=""
          selectedKey={current}
          items={portfolios}
          classNames={{ tabList: 'gap-6', tab: 'text-xl font-bold px-0', cursor: 'hidden' }}
          variant="light"
          onSelectionChange={(v) => setCurrent(v.toString())}
        >
          {(item) => <Tab key={item.value} title={item.label}></Tab>}
        </Tabs>
        {current === 'tokens' && (
          <Button
            isIconOnly
            variant="flat"
            size="sm"
            radius="full"
            className="min-w-7 w-7 h-7 "
            onClick={() => router.push('/tokens')}
          >
            <Icon icon="fluent:add-12-filled" className="text-base text-primary" />
          </Button>
        )}
      </div>

      <div>
        {current === 'tokens' && <Tokens onClick={(v) => router.push(`/tokens/${v}`)} />}
        {current === 'nfts' && <NFTs />}
        {current === 'activity' && <Activity />}
      </div>
    </div>
  );
}
