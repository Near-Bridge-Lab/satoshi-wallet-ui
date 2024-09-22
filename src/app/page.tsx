'use client';
import Loading from '@/components/basic/Loading';
import Activity from '@/components/wallet/Activity';
import ChainSelector from '@/components/wallet/Chains';
import { NFTs } from '@/components/wallet/NTFs';
import Tools from '@/components/wallet/Tools';

import { formatFileUrl, formatNumber } from '@/utils/format';
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
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Home() {
  return (
    <main className="s-container">
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
  return (
    <div className="flex flex-col gap-2 items-center">
      <div className="font-bold">Near Account</div>
      <Popover>
        <PopoverTrigger>
          <div className="flex items-center gap-2 text-sm text-default-500 bg-foreground/10 h-6 px-2 rounded-full cursor-pointer">
            <div className="">XXX...x.near</div>
            <Icon icon="fluent:chevron-right-12-regular" />
          </div>
        </PopoverTrigger>
        <PopoverContent>
          <div className="p-1 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-5">
              <Image src={formatFileUrl('/assets/chain/near.svg')} width={24} height={24} />
              <Snippet classNames={{ base: 'bg-transparent p-0' }} hideSymbol>
                xxxxxx....near
              </Snippet>
            </div>
            <div className="flex items-center justify-between gap-5">
              <Image src={formatFileUrl('/assets/chain/btc.svg')} width={24} height={24} />
              <Snippet classNames={{ base: 'bg-transparent p-0' }} hideSymbol>
                xxxxxx....near
              </Snippet>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function Balance({ className }: { className?: string }) {
  const accountBalance = '0';

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className ?? ''}`}>
      <div className="text-4xl font-bold">{formatNumber(accountBalance || 0)} BTC</div>
      <div className="text-default-500">
        ≈ {formatNumber(0, { style: 'currency', currency: 'USD' })}
      </div>
    </div>
  );
}

const portfolios = [
  { label: 'Tokens', value: 'tokens' },
  { label: 'NFTs', value: 'nfts' },
  { label: 'Activity', value: 'activity' },
];

const Tokens = dynamic(() => import('@/components/wallet/Tokens').then((module) => module.Tokens), {
  loading: () => <Loading />,
  ssr: false,
});

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
      </div>

      <div>
        {current === 'tokens' && <Tokens onClick={(v) => router.push(`/tokens/${v}`)} />}
        {current === 'nfts' && <NFTs />}
        {current === 'activity' && <Activity />}
      </div>
    </div>
  );
}
