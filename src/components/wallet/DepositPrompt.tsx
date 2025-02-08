'use client';
import { RUNTIME_NETWORK } from '@/config';
import { useRequest } from '@/hooks/useHooks';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Alert, Button } from '@nextui-org/react';
import { executeBTCDepositAndAction, getDepositAmount } from 'btc-wallet';
import { useState } from 'react';

export default function DepositPrompt() {
  const depositAmount = '5000';
  const { data: depositAmountRes } = useRequest(() =>
    getDepositAmount(depositAmount, { env: RUNTIME_NETWORK }),
  );

  const [activateLoading, setActivateLoading] = useState(false);
  async function handleActivate() {
    try {
      setActivateLoading(true);
      const res = await executeBTCDepositAndAction({
        amount: depositAmount,
        env: RUNTIME_NETWORK,
      });
      console.log(res);
    } catch (error) {
      console.error(error);
    } finally {
      setActivateLoading(false);
    }
  }
  return (
    !!depositAmountRes?.newAccountMinDepositAmount && (
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
