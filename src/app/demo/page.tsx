'use client';
import { useDebouncedEffect, useRequest } from '@/hooks/useHooks';
import { nearServices } from '@/services/near';
import { setupWalletSelector, Wallet, WalletSelector } from '@near-wallet-selector/core';
import { type WalletSelectorModal, setupModal } from '@near-wallet-selector/modal-ui';
import { SignMessageMethod } from '@near-wallet-selector/core/src/lib/wallet';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Button, Card, CardBody, CardHeader, Input, Snippet } from '@nextui-org/react';
import {
  setupBTCWallet,
  executeBTCDepositAndAction,
  getDepositAmount,
  getBtcBalance,
  BtcWalletSelectorContextProvider,
  getWithdrawTransaction,
  useBtcWalletSelector,
} from 'btc-wallet';

import '@near-wallet-selector/modal-ui/styles.css';
// import { setupWalletButton, removeWalletButton } from '@/hooks/initWalletButton';
import Loading from '@/components/basic/Loading';
import { Icon } from '@iconify/react/dist/iconify.js';
import { formatAmount, parseAmount } from '@/utils/format';
import { RUNTIME_NETWORK } from '@/config';

declare global {
  interface Window {
    nearWalletSelector?: WalletSelector;
    nearWallet?: NearWallet;
  }
}

type NearWallet = Wallet &
  SignMessageMethod & {
    selectWallet?: () => void;
    isSignedIn?: boolean;
    accountId?: string;
    disconnect?: () => void;
  };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <BtcWalletSelectorContextProvider>
        <WalletPage />
      </BtcWalletSelectorContextProvider>
    </Suspense>
  );
}

function WalletPage() {
  const [walletSelectorModal, setWalletSelectorModal] = useState<WalletSelectorModal>();
  const [walletSelector, setWalletSelector] = useState<WalletSelector>();
  const [wallet, setWallet] = useState<NearWallet>();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [accountId, setAccountId] = useState<string>();

  const btcProvider = useBtcWalletSelector();

  useDebouncedEffect(
    () => {
      initWallet().catch((err) => {
        console.error(err);
        toast.error('Failed to initialize wallet selector');
      });
      setTimeout(() => {
        console.log('near wallet signedIn');
        window.nearWalletSelector?.on('signedIn', handleSignIn);
        window.nearWalletSelector?.on('accountsChanged', handleSignIn);
      }, 500);

      return () => {
        console.log('near wallet signedIn off');
        window.nearWalletSelector?.off('signedIn', handleSignIn);
        window.nearWalletSelector?.off('accountsChanged', handleSignIn);
      };
    },
    [],
    0,
  );

  async function initWallet() {
    const network = nearServices.getNearConnectionConfig();

    const selector = await setupWalletSelector({
      network,
      debug: true,
      modules: [
        setupBTCWallet({
          env: RUNTIME_NETWORK,
        }),
        // setupHotWallet(),
      ],
    });
    setWalletSelector(selector);
    window.nearWalletSelector = selector;

    const modal = setupModal(selector, {
      contractId: '',
      theme: 'dark',
    });
    setWalletSelectorModal(modal);

    if (selector.isSignedIn()) {
      handleSignIn();
    }
  }

  async function selectWallet() {
    walletSelectorModal?.show();
  }

  async function handleSignIn() {
    const wallet = await window.nearWalletSelector?.wallet();
    setWallet(wallet);
    const accountId = (await wallet?.getAccounts())?.[0].accountId;
    console.log('handleSignIn', accountId);
    setAccountId(accountId);
    setIsSignedIn(!!accountId);
  }

  async function disconnect() {
    try {
      await wallet?.signOut();
      console.log('disconnect', wallet);
      setIsSignedIn(false);
      setAccountId(undefined);
      setWallet(undefined);
    } catch (error) {
      console.error('disconnect error', error);
    }
  }

  useEffect(() => {
    window.nearWallet = {
      ...wallet,
      selectWallet,
      disconnect,
      isSignedIn,
      accountId,
    } as NearWallet;
  }, [wallet, isSignedIn, accountId]);

  // useEffect(() => {
  //   wallet && btcContext.account ? initWalletButton(wallet, btcContext!) : removeWalletButton();
  // }, [wallet, btcContext.account]);

  // const [loading, setLoading] = useState(false);
  // async function handleBatchTransfer() {
  //   setLoading(true);
  //   const res = await wallet
  //     ?.signAndSendTransactions({
  //       transactions: [
  //         { receiverId: 'wrap.testnet', actions: [{ type: 'Transfer', params: { deposit: '1' } }] },
  //         {
  //           receiverId:  'nbtc2-nsp.testnet',
  //           actions: [
  //             {
  //               type: 'FunctionCall',
  //               params: {
  //                 methodName: 'ft_transfer',
  //                 args: { receiver_id: 'jimi1.testnet', amount: '1', msg: '' },
  //                 deposit: '1',
  //                 gas: parseAmount(100, 12),
  //               },
  //             },
  //           ],
  //         },
  //       ],
  //     })
  //     .finally(() => setLoading(false));
  //   console.log(res);
  // }

  const [depositLoading, setDepositLoading] = useState(false);
  async function handleBurrowSupply() {
    if (!depositAmount) return;
    try {
      setDepositLoading(true);
      const res = await executeBTCDepositAndAction({
        amount: parseAmount(depositAmount, 8),
        // action: {
        //   receiver_id: 'contract.dev-burrow.testnet',
        //   amount: (0.0001 * 10 ** 8).toFixed(0),
        //   msg: '',
        // },
        env: RUNTIME_NETWORK,
      });
      toast.success('Deposit Success,message:' + JSON.stringify(res));
    } catch (error) {
      console.error('deposit error', error);
      toast.error('Deposit failed');
    } finally {
      setDepositLoading(false);
    }
  }

  const {
    data: btcBalance,
    run: runBtcBalance,
    loading: btcBalanceLoading,
  } = useRequest(getBtcBalance, {
    refreshDeps: [accountId],
  });
  const [depositAmount, setDepositAmount] = useState<string>('0.0001');

  const { data: depositAmountRes, loading: depositAmountLoading } = useRequest(
    () => getDepositAmount(parseAmount(depositAmount, 8), { env: RUNTIME_NETWORK }),
    {
      refreshDeps: [depositAmount, accountId],
      before: () => !!accountId,
      debounceOptions: 1000,
    },
  );

  const [withdrawLoading, setWithdrawLoading] = useState(false);
  async function handleWithdraw() {
    if (!depositAmount) return;
    try {
      setWithdrawLoading(true);
      const res = await getWithdrawTransaction({
        amount: parseAmount(depositAmount, 8),
        env: RUNTIME_NETWORK,
      });
      console.log(res);
      const tx = await wallet?.signAndSendTransaction(res);
      console.log(tx);
      toast.success('Withdraw Success');
    } catch (error) {
      console.error('withdraw error', error);
      toast.error('Withdraw failed');
    } finally {
      setWithdrawLoading(false);
    }
  }

  return (
    <div className="w-screen h-screen bg-black">
      <div className="s-container  flex flex-col gap-5">
        <Card>
          <CardHeader className="font-bold text-lg">Wallet Connect</CardHeader>
          <CardBody className="gap-3">
            {isSignedIn ? (
              <>
                <Snippet
                  symbol={
                    <span className="text-xs text-default-500 inline-block pl-3 w-16">NEAR</span>
                  }
                  size="sm"
                >
                  {accountId}
                </Snippet>
                <Snippet
                  symbol={
                    <span className="text-xs text-default-500 inline-block pl-3 w-16">BTC</span>
                  }
                  size="sm"
                >
                  {btcProvider.account}
                </Snippet>
                <Button onClick={disconnect} size="sm">
                  Disconnect
                </Button>
              </>
            ) : (
              <Button color="primary" onClick={selectWallet}>
                Connect BTC Wallet
              </Button>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="font-bold text-lg">Native BTC Balance Info</CardHeader>
          <CardBody className="flex flex-row items-center justify-between gap-3 text-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-default-500">Balance:</span> {btcBalance?.balance || '0'}
                <span className="text-xs text-default-500">BTC</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-default-500">Available Balance:</span>{' '}
                {btcBalance?.availableBalance || '0'}
                <span className="text-xs text-default-500">BTC</span>
              </div>
            </div>
            <Button
              onClick={runBtcBalance}
              isIconOnly
              size="sm"
              isDisabled={btcBalanceLoading}
              variant="light"
            >
              <Icon
                icon="mdi:refresh"
                className={`text-xl ${btcBalanceLoading ? 'animate-spin' : ''}`}
              />
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="font-bold text-lg">BTC Deposit and Withdraw</CardHeader>
          <CardBody className="gap-5">
            <div className="flex items-center gap-3">
              <Input
                type="number"
                placeholder="Deposit BTC Amount"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                endContent={<span className="text-xs text-default-500">BTC</span>}
              />{' '}
            </div>
            <Loading loading={depositAmountLoading}>
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-default-500">Deposit Amount:</span>{' '}
                  <span>
                    {formatAmount(depositAmountRes?.depositAmount, 8) || '0'}{' '}
                    <span className="text-xs text-default-500">BTC</span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-default-500">Protocol Fee:</span>{' '}
                  <span>
                    {formatAmount(depositAmountRes?.protocolFee, 8) || '0'}{' '}
                    <span className="text-xs text-default-500">BTC</span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-default-500">Repay Amount:</span>{' '}
                  <span>
                    {formatAmount(depositAmountRes?.repayAmount, 8) || '0'}{' '}
                    <span className="text-xs text-default-500">BTC</span>
                  </span>
                </div>
                {depositAmountRes?.newAccountMinDepositAmount ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-default-500">New Account Min Deposit Amount:</span>{' '}
                    <span>
                      {formatAmount(depositAmountRes?.newAccountMinDepositAmount, 8) || '0'}{' '}
                      <span className="text-xs text-default-500">BTC</span>
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-default-500">Total Deposit Amount:</span>{' '}
                  <span>
                    {formatAmount(depositAmountRes?.totalDepositAmount, 8) || '0'}{' '}
                    <span className="text-xs text-default-500">BTC</span>
                  </span>
                </div>
              </div>
            </Loading>
            <div className="flex items-center gap-5">
              <Button
                isLoading={depositLoading}
                color="primary"
                className="flex-shrink-0 flex-1"
                onClick={handleBurrowSupply}
              >
                Deposit {depositAmount} BTC
              </Button>
              <Button
                isLoading={withdrawLoading}
                onClick={handleWithdraw}
                className="flex-shrink-0 flex-1"
              >
                Withdraw {depositAmount} BTC
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
