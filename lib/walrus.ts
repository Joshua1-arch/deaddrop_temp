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

// Human readable storage cost estimate in WAL and USD
export function getStorageCostEstimate(
  fileSizeBytes: number,
  epochs: number = 5
): { walCost: string; usdCost: string } {
  // ~0.01 WAL per MB per epoch
  const sizeInMB = fileSizeBytes / (1024 * 1024);
  const walCostVal = sizeInMB * 0.01 * epochs;
  const walCost = `~${walCostVal.toFixed(4)} WAL`;

  // Walrus pricing: $0.023 USD / GB / month.
  // One epoch is 14 days (approx 0.4599 months).
  // Cost = (size in GB) * 0.023 * (14 / 30.4375) * epochs
  const sizeInGB = fileSizeBytes / (1024 * 1024 * 1024);
  const months = (epochs * 14) / 30.4375;
  const usdCostVal = sizeInGB * 0.023 * months;
  
  // Show at least 4 decimal places if it's very small
  const usdCost = usdCostVal < 0.0001 
    ? `< $0.0001 USD` 
    : `~$${usdCostVal.toFixed(4)} USD`;

  return { walCost, usdCost };
}
