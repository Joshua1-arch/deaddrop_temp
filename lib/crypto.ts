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
