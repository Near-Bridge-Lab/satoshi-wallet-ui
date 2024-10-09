import { formatFileUrl } from '@/utils/format';
import { Wallet } from '@near-wallet-selector/core';

export function initWalletButton(
  wallet: Wallet,
  originalWallet: { account: string | null; getPublicKey: () => Promise<string> },
) {
  interface FloatingButtonOptions {
    openImageUrl: string;
    closeImageUrl: string;
    iframeUrl: string;
    iframeStyle?: { [key: string]: string };
  }

  if (document.getElementById('satoshi-wallet-button')) return;

  createFloatingButtonWithIframe({
    openImageUrl: formatFileUrl('/wallet-assets/wallet-btn.png'),
    closeImageUrl: formatFileUrl('/wallet-assets/wallet-btn-active.png'),
    iframeUrl: process.env.NEXT_PUBLIC_URL,
    iframeStyle: { width: '400px', height: '650px' },
  });

  function createFloatingButtonWithIframe(options: FloatingButtonOptions): HTMLImageElement {
    const { openImageUrl, closeImageUrl, iframeUrl, iframeStyle = {} } = options;

    const button = document.createElement('img');
    button.id = 'satoshi-wallet-button';
    button.src = openImageUrl;

    Object.assign(button.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      cursor: 'pointer',
      transition: 'transform 0.15s ease',
    });

    document.body.appendChild(button);

    let iframeVisible = false;
    let iframe: HTMLIFrameElement | null = null;

    console.log('iframe', iframe);

    button.onclick = async function () {
      button.style.transform = 'scale(0.8)';
      setTimeout(() => {
        button.style.transform = 'scale(1)';
      }, 150);

      if (!iframe) {
        iframe = document.createElement('iframe');

        const accountId = (await wallet?.getAccounts())?.[0].accountId;
        const originalAccountId = originalWallet.account;
        const originalPublicKey = await originalWallet.getPublicKey();
        console.log('accountId', accountId);
        console.log('originalAccountId', originalAccountId);
        console.log('originalPublicKey', originalPublicKey);
        const iframeSrc = new URL(iframeUrl);
        iframeSrc.searchParams.set('origin', window.location.origin);
        accountId && iframeSrc.searchParams.set('accountId', accountId);
        originalAccountId && iframeSrc.searchParams.set('originalAccountId', originalAccountId);
        originalPublicKey && iframeSrc.searchParams.set('originalPublicKey', originalPublicKey);
        iframe.src = iframeSrc.toString();

        Object.assign(iframe.style, {
          position: 'fixed',
          bottom: '90px',
          right: '20px',
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
          borderRadius: '10px',
          ...iframeStyle,
        });

        document.body.appendChild(iframe);
      }
      iframeVisible = !iframeVisible;
      button.src = iframeVisible ? closeImageUrl : openImageUrl;
      iframe.style.display = iframeVisible ? 'block' : 'none';
    };

    window.addEventListener('message', async (event) => {
      if (event.origin !== iframeUrl) return;
      const { action, requestId, params } = event.data;
      if (action === 'signAndSendTransaction') {
        console.log('message from iframe', event.data);
        try {
          const result = await wallet.signAndSendTransaction(params);
          console.log('signAndSendTransaction result', result);
          event.source?.postMessage(
            {
              requestId,
              result,
              success: true,
            },
            { targetOrigin: event.origin },
          );
        } catch (error: any) {
          console.error('signAndSendTransaction error', error);
          event.source?.postMessage(
            {
              requestId,
              error: error.message,
              success: false,
            },
            { targetOrigin: event.origin },
          );
        }
      }
    });

    return button;
  }
}
