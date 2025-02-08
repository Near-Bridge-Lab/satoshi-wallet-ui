'use client';
import { RUNTIME_NETWORK } from '@/config';
import { useDebouncedMemo } from '@/hooks/useHooks';
import { nearServices } from '@/services/near';
import { useWalletStore } from '@/stores/wallet';
import { rpcToWallet } from '@/utils/request';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Alert, Button } from '@nextui-org/react';
import { getConfig } from 'btc-wallet';
import { useState } from 'react';
import { toast } from 'react-toastify';

export default function DepositPrompt() {
  const { accountId } = useWalletStore();
  const depositAmount = '5000';

  const isNewAccount = useDebouncedMemo(async () => {
    if (!accountId) return;
    const config = await getConfig(RUNTIME_NETWORK);
    const res = await nearServices.query({
      contractId: config.accountContractId,
      method: 'get_account',
      args: { account_id: accountId },
    });
    return !res?.nonce;
  }, [accountId]);

  const [activateLoading, setActivateLoading] = useState(false);
  async function handleActivate() {
    try {
      setActivateLoading(true);
      await rpcToWallet('executeBTCDepositAndAction' as any, {
        amount: depositAmount,
        env: RUNTIME_NETWORK,
      });
      toast.success('Activate success');
    } catch (error) {
      console.error(error);
    } finally {
      setActivateLoading(false);
    }
  }
  return (
    isNewAccount && (
      <div className="mb-4">
        <Alert
          variant="faded"
          color="warning"
          icon={<Icon icon="mdi:account" />}
          description="Activate your account to start managing your BTC assets."
          classNames={{ base: 'items-center' }}
          endContent={
            <Button color="primary" size="sm" isLoading={activateLoading} onClick={handleActivate}>
              Activate
            </Button>
          }
        ></Alert>
      </div>
    )
  );
}
