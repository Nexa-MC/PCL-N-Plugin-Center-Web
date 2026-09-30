// 浏览器侧 WebAuthn（passkey）仪式封装：服务端使用 base64url 字符串，
// navigator.credentials 使用 ArrayBuffer，这里负责双向转换与错误归一化。

export function b64ToBuf(value: string): ArrayBuffer {
  const bin = atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export function bufToB64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export interface RegisterOptions {
  challenge: string;
  rp: { id: string; name: string };
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: { type: 'public-key'; alg: number }[];
  timeout?: number;
  authenticatorSelection?: AuthenticatorSelectionCriteria;
  attestation?: AttestationConveyancePreference;
  excludeCredentials?: { type: string; id: string }[];
}

export interface CreatedPasskey {
  id: string;
  rawId: string;
  response: { clientDataJSON: string; attestationObject: string };
}

export async function createPasskey(options: RegisterOptions): Promise<CreatedPasskey> {
  if (typeof navigator === 'undefined' || !navigator.credentials) throw new Error('当前浏览器不支持 passkey');
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: b64ToBuf(options.challenge),
      rp: options.rp,
      user: { id: b64ToBuf(options.user.id), name: options.user.name, displayName: options.user.displayName },
      pubKeyCredParams: options.pubKeyCredParams,
      timeout: options.timeout,
      authenticatorSelection: options.authenticatorSelection,
      attestation: options.attestation ?? 'none',
      excludeCredentials: (options.excludeCredentials ?? []).map(c => ({ type: 'public-key' as const, id: b64ToBuf(c.id) }))
    }
  });
  if (!credential || credential.type !== 'public-key') throw new Error('passkey 创建被取消');
  const response = (credential as PublicKeyCredential).response as AuthenticatorAttestationResponse;
  return {
    id: credential.id,
    rawId: bufToB64((credential as PublicKeyCredential).rawId),
    response: { clientDataJSON: bufToB64(response.clientDataJSON), attestationObject: bufToB64(response.attestationObject) }
  };
}

export interface AssertOptions {
  challenge: string;
  rpId: string;
  timeout?: number;
  userVerification?: UserVerificationRequirement;
  allowCredentials: { type: string; id: string }[];
}

export interface PasskeyAssertion {
  credentialId: string;
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
}

export async function assertPasskey(options: AssertOptions): Promise<PasskeyAssertion> {
  if (typeof navigator === 'undefined' || !navigator.credentials) throw new Error('当前浏览器不支持 passkey');
  const credential = await navigator.credentials.get({
    publicKey: {
      challenge: b64ToBuf(options.challenge),
      rpId: options.rpId,
      timeout: options.timeout,
      userVerification: options.userVerification ?? 'preferred',
      allowCredentials: options.allowCredentials.map(c => ({ type: 'public-key' as const, id: b64ToBuf(c.id) }))
    }
  });
  if (!credential || credential.type !== 'public-key') throw new Error('passkey 验证被取消');
  const response = (credential as PublicKeyCredential).response as AuthenticatorAssertionResponse;
  return {
    credentialId: credential.id,
    clientDataJSON: bufToB64(response.clientDataJSON),
    authenticatorData: bufToB64(response.authenticatorData),
    signature: bufToB64(response.signature)
  };
}
