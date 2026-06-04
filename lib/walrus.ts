// Walrus Testnet endpoints
const PUBLISHER = 'https://publisher.walrus-testnet.walrus.space';
const AGGREGATOR = 'https://aggregator.walrus-testnet.walrus.space';

// Upload encrypted bytes to Walrus
// Returns the blobId string
export async function uploadToWalrus(
  encryptedBytes: Uint8Array,
  epochs: number = 5
): Promise<string> {
  // Reject files over 50MB before uploading
  const MAX_SIZE = 50 * 1024 * 1024;
  if (encryptedBytes.byteLength > MAX_SIZE) {
    throw new Error(`File exceeds maximum size limit of 50MB (got ${(encryptedBytes.byteLength / (1024 * 1024)).toFixed(2)}MB).`);
  }

  console.log(`[Walrus] Uploading ${encryptedBytes.byteLength} bytes for ${epochs} epoch(s)...`);

  const response = await fetch(`${PUBLISHER}/v1/blobs?epochs=${epochs}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/octet-stream'
    },
    body: encryptedBytes as any
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Failed to upload to Walrus: ${response.status} ${response.statusText}. ${errorText}`);
  }

  const data = await response.json();
  const blobId = data.newlyCreated?.blobObject?.blobId || data.alreadyCertified?.blobId;

  if (!blobId) {
    throw new Error('Upload succeeded but no blobId was returned in the response.');
  }

  console.log(`[Walrus] Successfully stored blob: ${blobId}`);
  return blobId;
}

// Fetch encrypted bytes from Walrus by blobId
export async function fetchFromWalrus(
  blobId: string
): Promise<Uint8Array> {
  console.log(`[Walrus] Fetching blob ${blobId}...`);
  const response = await fetch(`${AGGREGATOR}/v1/blobs/${blobId}`);

  if (response.status === 404) {
    throw new Error('Document not found on Walrus');
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch from Walrus: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

// Human readable storage cost estimate
export function getStorageCostEstimate(
  fileSizeBytes: number,
  epochs: number = 5
): string {
  // ~0.01 WAL per MB per epoch
  const sizeInMB = fileSizeBytes / (1024 * 1024);
  const cost = sizeInMB * 0.01 * epochs;
  return `~${cost.toFixed(4)} WAL`;
}
