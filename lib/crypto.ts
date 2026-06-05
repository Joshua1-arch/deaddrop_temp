// Client-side AES-256-GCM encryption utilities using browser-native Web Crypto API

// Helper to convert key string to CryptoKey
async function importKey(keyStr: string): Promise<CryptoKey> {
  const cleanKey = keyStr.replace(/^dd-key-/, '').replace(/-/g, '');
  if (cleanKey.length !== 64) {
    throw new Error('Invalid key length. Key must be a 64-character hex string (after removing prefix/dashes).');
  }
  const rawKey = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    rawKey[i] = parseInt(cleanKey.slice(i * 2, i * 2 + 2), 16);
  }
  return globalThis.crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Helper: base64 to bytes
export function base64ToBytes(base64: string): Uint8Array {
  const binString = atob(base64);
  return Uint8Array.from(binString, (m) => m.charCodeAt(0));
}

// Helper: bytes to base64
export function bytesToBase64(bytes: Uint8Array): string {
  const binString = Array.from(bytes, (x) => String.fromCharCode(x)).join("");
  return btoa(binString);
}

// Generate a new AES-256-GCM key
// Return as "dd-key-{hex}" string
export async function generateKey(): Promise<string> {
  const arr = new Uint8Array(32);
  globalThis.crypto.getRandomValues(arr);
  const hex = Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `dd-key-${hex}`;
}

// Encrypt file bytes with the key
// Return encrypted Uint8Array (with 12-byte IV prepended)
export async function encryptDocument(
  fileBytes: Uint8Array,
  keyString: string
): Promise<Uint8Array> {
  const key = await importKey(keyString);
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedBuffer = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    fileBytes as any
  );

  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);
  return combined;
}

// Decrypt bytes with the key
// Return decrypted Uint8Array
export async function decryptDocument(
  encryptedBytes: Uint8Array,
  keyString: string
): Promise<Uint8Array> {
  if (encryptedBytes.length <= 12) {
    throw new Error('Invalid encrypted file layout (too short).');
  }
  
  const key = await importKey(keyString);
  const iv = encryptedBytes.slice(0, 12);
  const ciphertext = encryptedBytes.slice(12);

  try {
    const decryptedBuffer = await globalThis.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext as any
    );
    return new Uint8Array(decryptedBuffer);
  } catch (error) {
    throw new Error('Decryption failed. Please verify your decryption key.');
  }
}

// Compute SHA-256 hash of bytes
// Return as hex string
export async function sha256(
  bytes: Uint8Array
): Promise<string> {
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', bytes as any);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Encrypt the AES key with recipient's 
// public key using ECDH + AES-256-GCM
// This is ECIES (Elliptic Curve Integrated 
// Encryption Scheme)
export async function wrapKeyForRecipient(
  aesKeyString: string,
  recipientPublicKeyBytes: Uint8Array
): Promise<Uint8Array> {
  const pubKeyToUse = recipientPublicKeyBytes;

  // 1. Generate ephemeral ECDH key pair
  const ephemeralKeyPair = await globalThis.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey']
  );

  // 2. Import recipient public key
  const recipientPublicKey = await globalThis.crypto.subtle.importKey(
    'raw',
    pubKeyToUse as any,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // 3. Derive shared secret via ECDH
  const sharedSecret = await globalThis.crypto.subtle.deriveKey(
    { name: 'ECDH', public: recipientPublicKey },
    ephemeralKeyPair.privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // 4. Encrypt the AES key string with 
  //    shared secret
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const keyBytes = new TextEncoder().encode(aesKeyString);
  const encryptedKey = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    sharedSecret,
    keyBytes as any
  );

  // 5. Export ephemeral public key
  const ephemeralPublicKeyBytes = await globalThis.crypto.subtle.exportKey(
    'raw',
    ephemeralKeyPair.publicKey
  );

  // 6. Return: ephemeralPubKey(65) + iv(12) + 
  //            encryptedKey
  const result = new Uint8Array(
    65 + 12 + encryptedKey.byteLength
  );
  result.set(new Uint8Array(ephemeralPublicKeyBytes), 0);
  result.set(iv, 65);
  result.set(new Uint8Array(encryptedKey), 77);
  return result;
}

// Unwrap the AES key using recipient's 
// private key (from wallet)
export async function unwrapKeyWithWallet(
  wrappedKeyBytes: Uint8Array,
  walletPrivateKeyBytes: Uint8Array
): Promise<string> {
  const privKeyToUse = walletPrivateKeyBytes;

  // 1. Extract components
  const ephemeralPublicKeyBytes = wrappedKeyBytes.slice(0, 65);
  const iv = wrappedKeyBytes.slice(65, 77);
  const encryptedKeyBytes = wrappedKeyBytes.slice(77);

  // 2. Import wallet private key
  const privateKey = await globalThis.crypto.subtle.importKey(
    'pkcs8',
    privKeyToUse as any,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveKey']
  );

  // 3. Import ephemeral public key
  const ephemeralPublicKey = await globalThis.crypto.subtle.importKey(
    'raw',
    ephemeralPublicKeyBytes as any,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // 4. Derive shared secret
  const sharedSecret = await globalThis.crypto.subtle.deriveKey(
    { name: 'ECDH', public: ephemeralPublicKey },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  // 5. Decrypt the AES key
  const decryptedKeyBytes = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    sharedSecret,
    encryptedKeyBytes as any
  );

  return new TextDecoder().decode(decryptedKeyBytes);
}

// Derive a symmetric wrapping AES key from a wallet message signature
export async function deriveKeyFromSignature(signatureBytes: Uint8Array): Promise<CryptoKey> {
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', signatureBytes as any);
  return globalThis.crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt the ECDH private key (PKCS#8 format) using the signature-derived key
export async function encryptPrivateKey(
  privateKey: CryptoKey,
  aesKey: CryptoKey
): Promise<Uint8Array> {
  const exportedPriv = await globalThis.crypto.subtle.exportKey('pkcs8', privateKey);
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    exportedPriv
  );
  const combined = new Uint8Array(12 + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), 12);
  return combined;
}

// Decrypt the private key bytes using the signature-derived key
export async function decryptPrivateKeyBytes(
  encryptedBytes: Uint8Array,
  aesKey: CryptoKey
): Promise<Uint8Array> {
  const iv = encryptedBytes.slice(0, 12);
  const ciphertext = encryptedBytes.slice(12);
  const decrypted = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    ciphertext as any
  );
  return new Uint8Array(decrypted);
}
