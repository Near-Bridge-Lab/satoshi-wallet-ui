import { formatFileUrl, formatNumber } from '@/utils/format';
import { Button, Image, Input } from '@nextui-org/react';
import { useState } from 'react';

export function Tokens({ className }: { className?: string }) {
  const tokens = ['near', 'wbtc'];

  function handleSend() {}

  return (
    <div className="flex flex-col gap-4">
      {tokens.map((token, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-2 bg-default-100 hover:bg-default-200 rounded-xl p-3 cursor-pointer text-sm"
        >
          <div className="flex items-center gap-2">
            <Image src={formatFileUrl(`/assets/crypto/${token}.svg`)} width={30} height={30} />
            <div>
              <div className="text-base font-bold">{token.toUpperCase()}</div>
              <div className="text-xs text-default-500">
                {formatNumber(58000, {
                  style: 'currency',
                  currency: 'USD',
                })}
              </div>
            </div>
          </div>
          <div>
            <div className="text-base font-bold text-right">{formatNumber(2)}</div>
            <div className="text-xs text-default-500 text-right">
              {formatNumber(116000, { style: 'currency', currency: 'USD' })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ImportToken() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  function handleImport() {
    setLoading(true);
  }

  return (
    <div className="flex flex-col gap-8 pb-3">
      <div>
        <Input
          placeholder="Token Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>
      <div>
        <Button color="primary" onClick={handleImport} isLoading={loading} fullWidth>
          Import
        </Button>
      </div>
    </div>
  );
}
