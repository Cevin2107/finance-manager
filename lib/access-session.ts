const ACCESS_PASSWORD = 'Anhquan210706';
const encoder = new TextEncoder();

async function signingKey() {
  const material = await crypto.subtle.digest(
    'SHA-256',
    encoder.encode(`${ACCESS_PASSWORD}:finance-manager-session-v1`)
  );
  return crypto.subtle.importKey('raw', material, { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

function encodeBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(
    atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')),
    (character) => character.charCodeAt(0)
  );
}

export async function checkAccessPassword(password: string) {
  const [submitted, expected] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(password)),
    crypto.subtle.digest('SHA-256', encoder.encode(ACCESS_PASSWORD)),
  ]);
  const submittedBytes = new Uint8Array(submitted);
  const expectedBytes = new Uint8Array(expected);
  let difference = 0;
  for (let index = 0; index < expectedBytes.length; index += 1) {
    difference |= submittedBytes[index] ^ expectedBytes[index];
  }
  return difference === 0;
}

export async function createAccessToken(expiresAt: number) {
  const expiry = String(expiresAt);
  const signature = await crypto.subtle.sign('HMAC', await signingKey(), encoder.encode(expiry));
  return `${expiry}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function verifyAccessToken(token: string | undefined) {
  if (!token) return false;
  const separator = token.indexOf('.');
  if (separator <= 0 || separator === token.length - 1) return false;
  const expiry = token.slice(0, separator);
  const expiresAt = Number(expiry);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  try {
    return await crypto.subtle.verify(
      'HMAC',
      await signingKey(),
      decodeBase64Url(token.slice(separator + 1)),
      encoder.encode(expiry)
    );
  } catch {
    return false;
  }
}
