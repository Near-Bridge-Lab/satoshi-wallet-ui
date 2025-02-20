'use client';
import Loading from '@/components/basic/Loading';
import Navbar from '@/components/basic/Navbar';
import { useTokenSelector } from '@/components/wallet/Tokens';
import { BTC_TOKEN_CONTRACT, NEAR_TOKEN_CONTRACT } from '@/config';
import { nearServices } from '@/services/near';
import { nearSwapServices } from '@/services/swap';
import { useTokenStore } from '@/stores/token';
import {
  formatAmount,
  formatNumber,
  formatPrice,
  formatToken,
  formatValidNumber,
  parseAmount,
} from '@/utils/format';
import { Icon } from '@iconify/react';
import { Button, Image, Input, Checkbox } from '@nextui-org/react';
import { get } from 'lodash-es';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { toast } from 'react-toastify';
import Big from 'big.js';
import { useClient, useRequest } from '@/hooks/useHooks';
import { transactionServices } from '@/services/tranction';
import Slippage from '@/components/wallet/Slippage';

interface SwapForm {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  acceptPriceImpact: boolean;
  slippage: number;
}

export default function Swap() {
  const { isClient } = useClient();
  const query = useSearchParams();
  const { displayableTokens, tokenMeta, balances, refreshBalance, prices } = useTokenStore();

  const defaultSlippage = 0.1;

  const {
    watch,
    control,
    register,
    getValues,
    setValue,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm<SwapForm>({
    defaultValues: {
      tokenIn: query.get('tokenIn') || BTC_TOKEN_CONTRACT,
      tokenOut: query.get('tokenOut') || NEAR_TOKEN_CONTRACT,
      amountIn: '',
      acceptPriceImpact: false,
      slippage: defaultSlippage,
    },
    mode: 'onTouched',
  });

  const amountIn = watch('amountIn') || '0';
  const tokenIn = watch('tokenIn');
  const tokenOut = watch('tokenOut');
  // 添加滑点相关状态
  const [slippage, setSlippage] = useState(defaultSlippage);

  const [priceReverse, setPriceReverse] = useState(false);

  const [isFocus, setIsFocus] = useState(false);

  const {
    data: swapResult,
    loading: queryLoading,
    run: handleRefresh,
  } = useRequest(
    async () => {
      const res = await nearSwapServices.query({
        tokenIn,
        tokenOut,
        amountIn,
        slippage: slippage / 100,
      });
      const impact = await nearSwapServices.queryPriceImpact({
        tokenIn,
        tokenOut,
        amountIn,
      });
      return { ...res, impact };
    },
    {
      refreshDeps: [amountIn, tokenIn, tokenOut, slippage],
      debounceOptions: { wait: 500 },
      pollingInterval: 8000,
    },
  );

  const { loading: swapLoading, run: handleSwap } = useRequest(
    async () => {
      if (new Big(amountIn || 0).eq(0)) return;
      const res = await nearSwapServices.swap({
        tokenIn,
        tokenOut,
        amountIn,
      });

      refreshBalance(tokenIn);
      refreshBalance(tokenOut);
      toast.success('Swap success');
      return res;
    },
    {
      manual: true,
      onError: (error) => {
        console.error(error);
        toast.error('Swap failed');
      },
    },
  );

  const displayPrice = useMemo(() => {
    if (!swapResult?.amountOut || new Big(swapResult.amountOut).eq(0)) return '0';

    if (priceReverse) {
      const price = new Big(1).div(swapResult.amountOut).times(swapResult.amountIn).toString();
      return `1 ${tokenMeta[tokenOut]?.symbol} ≈ ${formatPrice(price)} ${tokenMeta[tokenIn]?.symbol}`;
    }
    const price = new Big(swapResult.amountOut).div(swapResult.amountIn).toString();
    return `1 ${tokenMeta[tokenIn]?.symbol} ≈ ${formatPrice(price)} ${tokenMeta[tokenOut]?.symbol}`;
  }, [priceReverse, tokenIn, tokenOut, swapResult?.amountOut, tokenMeta]);

  const priceImpactFlag = useMemo(
    () =>
      (swapResult?.impact || 0) > 2
        ? 'danger'
        : (swapResult?.impact || 0) >= 1
          ? 'warning'
          : undefined,
    [swapResult?.impact],
  );

  const balanceIn = useMemo(() => balances?.[tokenIn], [balances, tokenIn]);

  const isInsufficientBalance = useMemo(() => {
    const amountIn = getValues('amountIn');
    if (!amountIn || !balanceIn) return false;
    try {
      return new Big(amountIn).gt(balanceIn);
    } catch {
      return false;
    }
  }, [balanceIn, getValues('amountIn')]);

  const validator = useCallback(
    (key: keyof typeof errors) => {
      const error = get(errors, key);
      return error ? { isInvalid: true, errorMessage: error?.message?.toString() } : {};
    },
    [errors],
  );

  const balanceOut = useMemo(() => balances?.[tokenOut], [balances, tokenOut]);

  const tokenInPrice = useMemo(() => {
    const symbol = tokenMeta[tokenIn]?.symbol;
    if (!symbol || !prices[symbol]) return '0';
    return prices[symbol];
  }, [tokenIn, tokenMeta, prices]);

  const tokenOutPrice = useMemo(() => {
    const symbol = tokenMeta[tokenOut]?.symbol;
    if (!symbol || !prices[symbol]) return '0';
    return prices[symbol];
  }, [tokenOut, tokenMeta, prices]);

  const tokenInUSDValue = useMemo(() => {
    if (new Big(amountIn).eq(0) || !tokenIn) return '0';
    return new Big(amountIn).times(tokenInPrice).toString();
  }, [amountIn, tokenIn, tokenInPrice]);

  const tokenOutUSDValue = useMemo(() => {
    if (!swapResult?.amountOut || !tokenOut) return '0';
    return new Big(swapResult.amountOut).times(tokenOutPrice).toString();
  }, [swapResult?.amountOut, tokenOut, tokenOutPrice]);

  const handleSwapDirection = useCallback(() => {
    const currentTokenIn = getValues('tokenIn');
    const currentTokenOut = getValues('tokenOut');

    setValue('tokenIn', currentTokenOut);
    setValue('tokenOut', currentTokenIn);

    setValue('amountIn', '');
  }, [setValue, getValues]);

  const { open } = useTokenSelector();

  async function handleSelectToken(type: 'in' | 'out') {
    const token = await open({ value: type === 'in' ? tokenIn : tokenOut });
    if (!token) return;
    if (type === 'in') {
      if (token === tokenIn) return;
      if (token === tokenOut) {
        handleSwapDirection();
        return;
      }
      setValue('tokenIn', token);
      setValue('amountIn', '');
    } else {
      if (token === tokenOut) return;
      if (token === tokenIn) {
        handleSwapDirection();
        return;
      }
      setValue('tokenOut', token);
      setValue('amountIn', '');
    }
  }

  const TokenSelector = useCallback(
    ({ token, onSelect }: { token: string; onSelect: (token: string) => void }) => {
      return (
        <Button
          variant="flat"
          className="flex items-center gap-2"
          radius="full"
          onClick={() => onSelect(token)}
        >
          <Image
            src={tokenMeta[token]?.icon}
            width={24}
            height={24}
            alt={tokenMeta[token]?.symbol || 'token'}
          />
          <span>{formatToken(tokenMeta[token]?.symbol)}</span>
          <Icon
            icon="solar:alt-arrow-down-bold"
            className="text-xs text-default-500 flex-shrink-0"
          />
        </Button>
      );
    },
    [tokenMeta],
  );

  const availableBalance = useMemo(
    () => nearServices.getAvailableBalance(getValues('tokenIn'), balanceIn),
    [balanceIn, getValues('tokenIn')],
  );

  return (
    <Suspense fallback={<Loading />}>
      <div className="s-container">
        <Navbar
          className="mb-5"
          endContent={
            <div className="flex justify-end gap-2">
              <Button
                isIconOnly
                variant="flat"
                size="sm"
                isDisabled={queryLoading}
                onClick={handleRefresh}
              >
                <Icon
                  icon="ic:sharp-refresh"
                  className={`text-base ${queryLoading ? 'animate-spin' : ''}`}
                />
              </Button>
              <Slippage value={slippage} onChange={setSlippage} />
            </div>
          }
        >
          <div className="text-lg font-bold text-center">Swap</div>
        </Navbar>

        {isClient && (
          <>
            <div className="flex flex-col gap-5">
              <div>
                {/* Token Input */}
                <div
                  className={`bg-default-50 p-4 rounded-lg border hover:border-primary ${
                    isFocus ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <div className="text-base font-medium text-default-500 mb-2">Pay</div>
                  <div className="flex justify-between mb-2">
                    <Controller
                      name="amountIn"
                      control={control}
                      rules={{
                        required: true,
                        validate: (value) => {
                          if (new Big(value || 0).gt(availableBalance)) {
                            return new Big(availableBalance || 0).eq(0)
                              ? 'Insufficient balance'
                              : `Amount is greater than available balance: ${availableBalance}`;
                          }
                          return true;
                        },
                      }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          classNames={{
                            base: 'flex-1',
                            input: 'text-2xl font-medium',
                            inputWrapper: '!bg-transparent !border-none pl-0 shadow-none',
                          }}
                          size="lg"
                          variant="bordered"
                          placeholder="0"
                          {...validator('amountIn')}
                          validationBehavior="aria"
                          autoComplete="off"
                          onChange={(e) => {
                            field.onChange(formatValidNumber(e.target.value));
                          }}
                          onFocus={() => setIsFocus(true)}
                          onBlur={() => setIsFocus(false)}
                        />
                      )}
                    />
                    <TokenSelector
                      token={getValues('tokenIn')}
                      onSelect={() => handleSelectToken('in')}
                    />
                  </div>
                  <div className="flex justify-between gap-2">
                    <div className="text-default-500 text-sm">${formatPrice(tokenInUSDValue)}</div>
                    <div className="text-default-500 text-sm">
                      Balance: {formatNumber(balanceIn)}
                      <Button
                        size="sm"
                        variant="light"
                        color="primary"
                        className="ml-2 p-0 min-w-0 h-auto"
                        onClick={() => {
                          setValue(
                            'amountIn',
                            nearServices.getAvailableBalance(getValues('tokenIn'), balanceIn),
                          );
                          trigger('amountIn');
                        }}
                      >
                        MAX
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Swap Direction Button */}
                <div className="flex justify-center -my-3">
                  <Button
                    isIconOnly
                    className="bg-default-50 border border-default-300 z-[1]"
                    size="sm"
                    radius="full"
                    onClick={handleSwapDirection}
                  >
                    <Icon
                      icon="ic:baseline-swap-vert"
                      className="text-xl text-default-500 hover:text-default-800"
                    />
                  </Button>
                </div>

                {/* Token Output */}
                <div className="bg-default-50 p-4 rounded-lg">
                  <div className="text-base font-medium text-default-500 mb-2">Receive</div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-2xl font-medium">
                      {formatNumber(swapResult?.amountOut)}
                    </div>
                    <TokenSelector
                      token={getValues('tokenOut')}
                      onSelect={() => handleSelectToken('out')}
                    />
                  </div>
                  <div className="flex justify-between gap-2">
                    <div className="text-default-500 text-sm">${formatPrice(tokenOutUSDValue)}</div>
                    <div className="text-default-500 text-sm">
                      Balance: {formatNumber(balanceOut)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Impact Warning */}
              {priceImpactFlag === 'danger' && (
                <Controller
                  name="acceptPriceImpact"
                  control={control}
                  defaultValue={false}
                  render={({ field: { onChange, value } }) => (
                    <div className="w-full border border-danger/20 bg-danger/10 rounded-lg py-1.5 px-2 flex items-center justify-between">
                      <Checkbox
                        isSelected={value}
                        onValueChange={onChange}
                        size="sm"
                        color="danger"
                      >
                        <span className="text-danger text-xs">I accept the price impact</span>
                      </Checkbox>
                      <span className="text-danger text-sm">-{swapResult?.impact || 0}%</span>
                    </div>
                  )}
                />
              )}

              {/* Swap Button */}
              <Button
                color="primary"
                size="lg"
                className="font-bold"
                fullWidth
                isDisabled={
                  queryLoading ||
                  swapLoading ||
                  !swapResult ||
                  Object.keys(errors).length > 0 ||
                  (priceImpactFlag === 'danger' && !watch('acceptPriceImpact'))
                }
                onClick={handleSubmit(handleSwap)}
              >
                {queryLoading || swapLoading ? (
                  <Icon icon="eos-icons:three-dots-loading" className="text-3xl" />
                ) : isInsufficientBalance ? (
                  'Insufficient Balance'
                ) : (
                  'Swap'
                )}
              </Button>
            </div>

            {/* Swap Details */}
            {new Big(amountIn).gt(0) && swapResult && (
              <div className="mt-5  bg-default-50 p-4 rounded-lg text-sm text-default-500 leading-8">
                <div className="flex justify-between gap-2">
                  <span>Price</span>
                  <span className="flex-1 flex items-center justify-end gap-2">
                    <span className="flex-1 truncate max-w-[200px] text-right">{displayPrice}</span>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onClick={() => setPriceReverse(!priceReverse)}
                    >
                      <Icon icon="ic:twotone-swap-horiz" className="text-xl text-default-500" />
                    </Button>
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Price impact</span>
                  <span
                    className={
                      priceImpactFlag === 'danger'
                        ? 'text-danger'
                        : priceImpactFlag === 'warning'
                          ? 'text-warning'
                          : ''
                    }
                  >
                    {swapResult?.impact
                      ? swapResult.impact < 0.01
                        ? '<-0.01%'
                        : `-${swapResult?.impact}%`
                      : '0%'}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Minimum received</span>
                  <span className="truncate">
                    {formatNumber(swapResult.minAmountOut)} {tokenMeta[tokenOut]?.symbol}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Slippage</span>
                  <span>{slippage}%</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Suspense>
  );
}
