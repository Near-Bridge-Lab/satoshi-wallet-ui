'use client';
import Loading from '@/components/basic/Loading';
import Navbar from '@/components/basic/Navbar';
import { useTokenSelector } from '@/components/wallet/Tokens';
import { MAIN_TOKEN } from '@/config';
import { nearServices } from '@/services/near';
import { useTokenStore } from '@/stores/token';
import { formatNumber, formatToken, parseAmount } from '@/utils/format';
import { rpcToWallet } from '@/utils/request';
import { Icon } from '@iconify/react';
import { Button, Image, Input } from '@nextui-org/react';
import { get } from 'lodash-es';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';

interface SendForm {
  token: string;
  recipient: string;
  amount: string;
}

export default function Send() {
  const query = useSearchParams();
  const { displayableTokens, tokenMeta, balances, refreshBalance } = useTokenStore();

  const {
    watch,
    control,
    getValues,
    setValue,
    handleSubmit,
    clearErrors,
    formState: { errors },
    reset: resetFormData,
    trigger,
  } = useForm<SendForm>({
    defaultValues: {
      token: query.get('token') || MAIN_TOKEN,
      recipient: '',
      amount: '',
    },
  });

  useEffect(() => {
    if (!getValues('token') && displayableTokens?.length) setValue('token', displayableTokens[0]);
  }, [displayableTokens]);

  const balance = useMemo(() => balances?.[getValues('token')], [balances, getValues('token')]);

  const validator = useCallback(
    (key: keyof typeof errors) => {
      const error = get(errors, key);
      return error ? { isInvalid: true, errorMessage: error?.message?.toString() } : {};
    },
    [errors],
  );

  const { open } = useTokenSelector();

  async function handleSelectToken() {
    const token = await open({ value: getValues('token') });
    token && setValue('token', token);
  }

  async function handleSend(data: SendForm) {
    try {
      const registerTokenTrans = await nearServices.registerToken(data.token, data.recipient);
      const res = await rpcToWallet('signAndSendTransaction', {
        receiverId: data.token,
        actions: [
          ...(registerTokenTrans?.actions || []),
          {
            type: 'FunctionCall',
            params: {
              methodName: 'ft_transfer_call',
              args: {
                receiver_id: data.recipient,
                amount: parseAmount(data.amount, tokenMeta[data.token]?.decimals),
                msg: '',
              },
              deposit: '1',
              gas: parseAmount(100, 12),
            },
          },
        ],
      });
      console.log(res);
      refreshBalance(data.token);
      toast.success('Send success');
    } catch (error) {
      console.error(error);
      toast.error('Send failed');
    }
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="s-container flex flex-col gap-5">
        <Navbar className="mb-5">
          <div className="text-lg font-bold text-center">Send</div>
        </Navbar>
        <div className="flex-1 flex flex-col gap-8">
          <div>
            <div className="card cursor-pointer" onClick={handleSelectToken}>
              <div className="flex items-center gap-3">
                <Image src={tokenMeta[getValues('token')]?.icon} width={30} height={30} />
                <span className="text-base">
                  {formatToken(tokenMeta[getValues('token')]?.symbol)}
                </span>
              </div>
              <Icon icon="eva:chevron-right-fill" className="text-lg " />
            </div>
          </div>
          <Controller
            name="recipient"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Input
                label="To"
                labelPlacement="outside"
                size="lg"
                placeholder="Recipient's address"
                endContent={<Icon icon="hugeicons:contact-01" className="text-lg" />}
                {...validator('recipient')}
                variant={validator('recipient').isInvalid ? 'bordered' : 'flat'}
                {...field}
              />
            )}
          ></Controller>
          <div>
            <Controller
              name="amount"
              control={control}
              rules={{ required: true, min: 0, max: balance }}
              render={({ field }) => (
                <Input
                  label="Amount"
                  labelPlacement="outside"
                  size="lg"
                  placeholder="0"
                  type="number"
                  endContent={
                    <span className="font-bold">
                      {formatToken(tokenMeta[getValues('token')]?.symbol)}
                    </span>
                  }
                  {...validator('amount')}
                  variant={validator('amount').isInvalid ? 'bordered' : 'flat'}
                  {...field}
                />
              )}
            ></Controller>
            <div className="text-default-500 text-right text-xs mt-3">
              Balance: {formatNumber(balance)} {formatToken(tokenMeta[getValues('token')]?.symbol)}
              <Button
                size="sm"
                color="primary"
                className="py-0.5 px-2 min-w-min w-auto h-auto ml-2"
                onClick={() => setValue('amount', balance || '0')}
              >
                MAX
              </Button>
            </div>
          </div>
        </div>
        <div>
          <Button
            color="primary"
            size="lg"
            className="font-bold"
            fullWidth
            onClick={handleSubmit(handleSend)}
          >
            Send
          </Button>
        </div>
      </div>
    </Suspense>
  );
}
