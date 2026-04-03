'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { SiweMessage } from 'siwe';
import { Button } from '@/components/ui/Button';
import { copy } from '@/lib/copy';

function utf8ToHexMessage(s: string) {
  return `0x${Array.from(new TextEncoder().encode(s), (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

type Props = {
  callbackUrl: string;
  label: string;
};

export function MetaMaskSignInButton({ callbackUrl, label }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    if (typeof window === 'undefined' || !window.ethereum) {
      setError(copy.auth.metaMaskUnavailable);
      return;
    }
    setBusy(true);
    try {
      const nonceRes = await fetch('/api/auth/siwe/nonce', { credentials: 'include' });
      if (!nonceRes.ok) throw new Error('nonce');
      const { nonce } = (await nonceRes.json()) as { nonce: string };

      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];
      const address = accounts[0];
      if (!address) throw new Error('no account');

      const chainIdHex = (await window.ethereum.request({
        method: 'eth_chainId',
      })) as string;
      const chainId = parseInt(chainIdHex, 16);

      const siwe = new SiweMessage({
        domain: window.location.host,
        address,
        statement: copy.auth.siweStatement,
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce,
        issuedAt: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });
      const prepared = siwe.prepareMessage();
      const signature = (await window.ethereum.request({
        method: 'personal_sign',
        params: [utf8ToHexMessage(prepared), address.toLowerCase()],
      })) as string;

      const result = await signIn('credentials', {
        message: prepared,
        signature,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError(copy.auth.metaMaskSignInError);
      } else if (result?.ok && result.url) {
        window.location.assign(result.url);
      }
    } catch {
      setError(copy.auth.metaMaskSignInError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="secondary" className="w-full justify-center" disabled={busy} onClick={handleClick}>
        {busy ? '…' : label}
      </Button>
      {error ? <p className="text-center text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
