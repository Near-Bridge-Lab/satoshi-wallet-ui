'use client';
import { useDebouncedEffect } from '@/hooks/useHooks';
import { nearServices } from '@/services/near';
import { setupWalletSelector, Wallet, WalletSelector } from '@near-wallet-selector/core';
import { type WalletSelectorModal, setupModal } from '@near-wallet-selector/modal-ui';
import { SignMessageMethod } from '@near-wallet-selector/core/src/lib/wallet';
import { Suspense, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Button } from '@nextui-org/react';
import { setupBTCWallet, useBtcWalletSelector, BtcWalletSelectorContextProvider } from 'btc-wallet';

import '@near-wallet-selector/modal-ui/styles.css';
// import { setupWalletButton, removeWalletButton } from '@/hooks/initWalletButton';
import Loading from '@/components/basic/Loading';
import { parseAmount } from '@/utils/format';

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
      modules: [setupBTCWallet({})],
    });
    setWalletSelector(selector);
    window.nearWalletSelector = selector;

    const modal = setupModal(selector, {
      contractId: '',
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
  }

  async function disconnect() {
    try {
      await wallet?.signOut();
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

  const [loading, setLoading] = useState(false);
  async function handleBatchTransfer() {
    setLoading(true);
    const res = await wallet
      ?.signAndSendTransactions({
        transactions: [
          { receiverId: 'wrap.testnet', actions: [{ type: 'Transfer', params: { deposit: '1' } }] },
          {
            receiverId: 'nbtc2-nsp.testnet',
            actions: [
              {
                type: 'FunctionCall',
                params: {
                  methodName: 'ft_transfer',
                  args: { receiver_id: 'jimi1.testnet', amount: '1', msg: '' },
                  deposit: '1',
                  gas: parseAmount(100, 12),
                },
              },
            ],
          },
        ],
      })
      .finally(() => setLoading(false));
    console.log(res);
  }

  return (
    <div className="w-screen h-screen bg-black">
      <div className="s-container">
        <h1>Wallet Selector</h1>
        <div className="flex items-center gap-5 my-5">
          <Button onClick={selectWallet}>Select Wallet</Button>
          <Button onClick={disconnect}>Disconnect</Button>
        </div>
        <p className="mb-5">Account: {accountId}</p>
        <Button isLoading={loading} onClick={handleBatchTransfer}>
          Batch Transfer
        </Button>
      </div>
    </div>
  );
}
