'use client';
import Navbar from '@/components/basic/Navbar';
import { useTokenSelector } from '@/components/wallet/Tokens';
import { useRequest } from '@/hooks/useHooks';
import { nearServices } from '@/services/near';
import { useWalletStore } from '@/stores/wallet';
import { formatFileUrl, formatNumber } from '@/utils/format';
import { Icon } from '@iconify/react';
import { Button, Image, Input } from '@nextui-org/react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function Send() {
  const query = useSearchParams();
  const { displayableTokens, tokenMeta } = useWalletStore();
  const [selectedToken, setSelectedToken] = useState<string>(query.get('token') || '');
  const [recipient, setRecipient] = useState<string>();
  const [amount, setAmount] = useState<string>();

  useEffect(() => {
    if (!selectedToken && displayableTokens?.length) setSelectedToken(displayableTokens[0]);
  }, [displayableTokens]);

  const { data: balance, run: refreshBalance } = useRequest(
    () => nearServices.getBalance(selectedToken),
    {
      refreshDeps: [selectedToken],
    },
  );

  const { open } = useTokenSelector();

  async function handleSelectToken() {
    const token = await open({ value: selectedToken });
    token && setSelectedToken(token);
  }
  return (
    <div className="s-container flex flex-col gap-5">
      <Navbar className="mb-5">
        <div className="text-lg font-bold text-center">Send</div>
      </Navbar>
      <div className="flex-1 flex flex-col gap-8">
        <div>
          <div className="card cursor-pointer" onClick={handleSelectToken}>
            <div className="flex items-center gap-3">
              <Image src={tokenMeta[selectedToken]?.icon} width={30} height={30} />
              <span className="text-base">{tokenMeta[selectedToken]?.symbol}</span>
            </div>
            <Icon icon="eva:chevron-right-fill" className="text-lg " />
          </div>
        </div>
        <div>
          <Input
            label="To"
            labelPlacement="outside"
            size="lg"
            placeholder="Recipient's address"
            endContent={<Icon icon="hugeicons:contact-01" className="text-lg" />}
          />
        </div>
        <div>
          <Input
            label="Amount"
            value={amount}
            onValueChange={(v) => setAmount(v)}
            labelPlacement="outside"
            size="lg"
            placeholder="0"
            endContent={<span className="font-bold">NEAR</span>}
          />
          <div className="text-default-500 text-right text-xs mt-3">
            Balance: {formatNumber(balance)} {tokenMeta[selectedToken]?.symbol}
            <Button
              size="sm"
              color="primary"
              className="py-0.5 px-2 min-w-min w-auto h-auto ml-2"
              onClick={() => setAmount(balance)}
            >
              MAX
            </Button>
          </div>
        </div>
      </div>
      <div>
        <Button color="primary" size="lg" className="font-bold" fullWidth>
          Send
        </Button>
      </div>
    </div>
  );
}
