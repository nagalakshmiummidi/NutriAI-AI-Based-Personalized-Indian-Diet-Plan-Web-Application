import React, { useState } from 'react';
import { Button } from '@/button';

// base64url helpers (WebAuthn uses base64url)
function bufferToBase64Url(buffer: ArrayBuffer) {
  const b64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBuffer(base64url: string) {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  // pad
  const pad = base64.length % 4;
  if (pad) base64 += '='.repeat(4 - pad);
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export default function WebAuthnDemo() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [keysCount, setKeysCount] = useState<number | null>(null);

  const getUserId = (em: string) => `user-${btoa(em).replace(/=/g, '')}`;

  const register = async () => {
    if (!email.includes('@')) return setStatus('Enter valid email');
    const userId = getUserId(email);
    setLoading(true);
    setStatus('Requesting registration options...');

    const res = await fetch('http://localhost:4000/generate-registration-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, username: email }),
    });
    const options = await res.json();

    // Convert base64url strings to ArrayBuffers for navigator.credentials
    options.challenge = base64UrlToBuffer(options.challenge);
    options.user.id = base64UrlToBuffer(options.user.id);

    if (options.excludeCredentials) {
      options.excludeCredentials = options.excludeCredentials.map((c: any) => ({
        ...c,
        id: base64UrlToBuffer(c.id),
      }));
    }

    const cred: any = await navigator.credentials.create({ publicKey: options });
    const attestationResponse: any = {
      id: cred.id,
      rawId: bufferToBase64Url(cred.rawId),
      response: {
        attestationObject: bufferToBase64Url((cred as any).response.attestationObject),
        clientDataJSON: bufferToBase64Url((cred as any).response.clientDataJSON),
      },
      type: cred.type,
    };

    const verify = await fetch('http://localhost:4000/verify-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, attestationResponse }),
    });
    const j = await verify.json();
    setStatus(j.ok ? 'Registration successful' : `Registration failed: ${j.error || ''}`);
    if (j.ok) {
      localStorage.setItem('current-user', userId);
      // refresh keys count
      try {
        const r = await fetch(`http://localhost:4000/user-credentials?userId=${userId}`);
        if (r.ok) {
          const jj = await r.json();
          setKeysCount((jj.credentials || []).length);
        }
      } catch (e) {}
    }
    setLoading(false);
  };

  const login = async () => {
    if (!email.includes('@')) return setStatus('Enter valid email');
    const userId = getUserId(email);
    setLoading(true);
    setStatus('Requesting authentication options...');

    const res = await fetch('http://localhost:4000/generate-authentication-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const options = await res.json();

    options.challenge = base64UrlToBuffer(options.challenge);
    if (options.allowCredentials) {
      options.allowCredentials = options.allowCredentials.map((c: any) => ({
        ...c,
        id: base64UrlToBuffer(c.id),
      }));
    }

    const assertion: any = await navigator.credentials.get({ publicKey: options });

    const authResponse = {
      id: assertion.id,
      rawId: bufferToBase64Url(assertion.rawId),
      response: {
        authenticatorData: bufferToBase64Url((assertion as any).response.authenticatorData),
        clientDataJSON: bufferToBase64Url((assertion as any).response.clientDataJSON),
        signature: bufferToBase64Url((assertion as any).response.signature),
        userHandle: (assertion as any).response.userHandle ? bufferToBase64Url((assertion as any).response.userHandle) : null,
      },
      type: assertion.type,
    };

    const verify = await fetch('http://localhost:4000/verify-authentication', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, assertionResponse: authResponse }),
    });
    const j = await verify.json();
    setStatus(j.ok ? 'Authentication successful' : `Authentication failed: ${j.error || ''}`);
    if (j.ok) {
      localStorage.setItem('current-user', userId);
    }
    setLoading(false);
  };

  // fetch registered key count when email changes
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!email.includes('@')) {
        setKeysCount(null);
        return;
      }
      const userId = getUserId(email);
      try {
        const r = await fetch(`http://localhost:4000/user-credentials?userId=${userId}`);
        if (!cancelled && r.ok) {
          const j = await r.json();
          setKeysCount((j.credentials || []).length);
        }
      } catch (e) {
        if (!cancelled) setKeysCount(null);
      }
    })();
    return () => { cancelled = true; };
  }, [email]);

  return (
    <div className="mt-4 p-3 bg-white/80 rounded shadow-sm border">
      <h3 className="text-sm font-medium mb-2">WebAuthn (Biometric) Demo</h3>
      <div className="flex flex-col sm:flex-row gap-2 items-center">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="border px-3 py-2 rounded w-full sm:w-72" />
        <div className="flex gap-2">
          <Button disabled={loading || !email.includes('@')} onClick={register} size="sm" className="bg-green-500 disabled:opacity-50 text-white px-3 py-2 rounded">{loading ? 'Working…' : 'Register (biometric)'}</Button>
          <Button disabled={loading || !email.includes('@')} onClick={login} size="sm" className="bg-blue-500 disabled:opacity-50 text-white px-3 py-2 rounded">{loading ? 'Working…' : 'Login (biometric)'}</Button>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-3">
        <div className="text-xs text-gray-600">Status:</div>
        <div className={`text-xs ${status.includes('successful') ? 'text-green-600' : status.includes('failed') ? 'text-red-600' : 'text-gray-700'}`}>{status || 'Idle'}</div>
        <div className="ml-auto text-xs text-gray-500">Registered keys: <span className="font-medium">{keysCount ?? '—'}</span></div>
      </div>
      <div className="text-[11px] text-gray-500 mt-2">Tip: Use a platform authenticator (Touch ID / Windows Hello) or a security key. Ensure the dev server origin matches the WebAuthn server origin.</div>
    </div>
  );
}
