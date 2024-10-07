import { useDebouncedMemo } from '@/hooks/useHooks';
import { useWalletStore } from '@/stores/wallet';
import { Image, Snippet } from '@nextui-org/react';
import QRCode from 'qrcode';

export default function Receive() {
  const { accountId } = useWalletStore();

  const qrcode = useDebouncedMemo(async () => {
    if (!accountId) return '';
    const res = await QRCode.toDataURL(accountId, {
      errorCorrectionLevel: 'H',
      width: 400,
      margin: 2,
    });
    return res;
  }, [accountId]);

  return (
    <div>
      <div className="flex items-center justify-center">
        <Image src={qrcode} width={260} height={260} />
      </div>
      <div className="flex items-center justify-center gap-2 p-5 ">
        <Snippet
          classNames={{ base: 'bg-transparent p-0', pre: 'whitespace-pre-wrap break-all' }}
          hideSymbol
        >
          {accountId}
        </Snippet>
      </div>
    </div>
  );
}
