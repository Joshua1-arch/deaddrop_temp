import { generateKey, encryptDocument, sha256 } from './crypto';
import { uploadToWalrus } from './walrus';
import { createPublication } from './sui';
import { PublishParams, PublishResult } from '../types/publication';

export async function publishDocument(
  params: PublishParams,
  signAndExecute: (options: { transaction: any }) => Promise<any>,
  onProgress: (
    step: 'encrypting' | 'uploading' | 'minting' | 'complete',
    detail?: string
  ) => void
): Promise<PublishResult> {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.log('[Orchestrator] Starting publication sequence for:', params.title);
  }

  // 1. Read file as Uint8Array
  let fileBytes: Uint8Array;
  try {
    if (isDev) console.log('[Orchestrator] Reading file bytes...');
    const buffer = await params.file.arrayBuffer();
    fileBytes = new Uint8Array(buffer);
  } catch (err: any) {
    throw new Error(`Failed to read file: ${err.message || err}`);
  }

  // 2. onProgress('encrypting')
  onProgress('encrypting', 'Encrypting your document...');

  // 3. generateKey() -> decryptionKey
  let decryptionKey: string;
  try {
    if (isDev) console.log('[Orchestrator] Generating cryptography key...');
    decryptionKey = await generateKey();
  } catch (err: any) {
    throw new Error(`Cryptography key generation failed: ${err.message || err}`);
  }

  // 4. sha256(fileBytes) -> hash
  let realHash: string;
  try {
    if (isDev) console.log('[Orchestrator] Calculating file SHA-256 hash...');
    realHash = await sha256(fileBytes);
  } catch (err: any) {
    throw new Error(`File hash computation failed: ${err.message || err}`);
  }

  // 5. encryptDocument(fileBytes, key) -> encrypted
  let encryptedBytes: Uint8Array;
  try {
    if (isDev) console.log('[Orchestrator] Encrypting document locally...');
    encryptedBytes = await encryptDocument(fileBytes, decryptionKey);
  } catch (err: any) {
    throw new Error(`AES-256 encryption failed: ${err.message || err}`);
  }

  // 6. onProgress('uploading')
  onProgress('uploading', 'Uploading to Walrus...');

  // 7. uploadToWalrus(encrypted) -> blobId
  let blobId: string;
  try {
    if (isDev) console.log('[Orchestrator] Uploading encrypted payload to Walrus...');
    blobId = await uploadToWalrus(encryptedBytes, 5);
  } catch (err: any) {
    throw new Error(`Walrus decentralized upload failed: ${err.message || err}`);
  }

  // 8. onProgress('minting')
  onProgress('minting', 'Minting on Sui blockchain...');

  // 9. createPublication({blobId, hash, ...}) -> { digest, objectId }
  let digest: string;
  let objectId: string;
  try {
    if (isDev) console.log('[Orchestrator] Minting publication on Sui...');
    const unlockAtMs = new Date(params.unlockAt).getTime();
    
    const res = await createPublication({
      blobId,
      sha256Hash: realHash, // Store the REAL SHA-256 hash of the original document on-chain
      title: params.title,
      category: params.category,
      unlockAtMs,
      signAndExecute
    });
    digest = res.digest;
    objectId = res.objectId;
  } catch (err: any) {
    throw new Error(`Sui blockchain registry failed: ${err.message || err}`);
  }

  // 10. onProgress('complete')
  onProgress('complete', 'Document successfully published!');

  // 11. return PublishResult
  return {
    objectId,
    blobId,
    transactionDigest: digest,
    decryptionKey
  };
}
