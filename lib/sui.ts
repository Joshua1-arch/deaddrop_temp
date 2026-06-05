// Sui Network Blockchain RPC functions & smart contract integrations using Tatum RPC
import { SuiJsonRpcClient as SuiClient } from '@mysten/sui/jsonRpc';
import { Transaction } from '@mysten/sui/transactions';
import { Publication } from '@/types/publication';
import { 
  TATUM_API_KEY, 
  PACKAGE_ID,
  CLOCK_OBJECT_ID 
} from './constants';

// Initialize the standard SuiClient connected to Tatum RPC gateway URL
function getSuiClient(): SuiClient {
  const rpcUrl = typeof window !== 'undefined'
    ? '/api/rpc'
    : 'https://sui-testnet.gateway.tatum.io';
    
  return new SuiClient({ url: rpcUrl, network: 'testnet' });
}

function checkPackageId() {
  const isZeroPackage = PACKAGE_ID === '0x0000000000000000000000000000000000000000' || !PACKAGE_ID.startsWith('0x') || PACKAGE_ID.length < 10;
  if (isZeroPackage) {
    throw new Error('Contract not deployed. Set NEXT_PUBLIC_PACKAGE_ID');
  }
}

// Get current Sui epoch number
export async function getCurrentEpoch(): Promise<number> {
  const client = getSuiClient();
  try {
    const systemState = await client.getLatestSuiSystemState();
    return Number(systemState.epoch);
  } catch (err) {
    console.error('[Sui] Failed to fetch system state epoch, defaulting to 0:', err);
    return 0;
  }
}

// Get current timestamp in milliseconds from chain
export async function getChainTimestamp(): Promise<number> {
  const client = getSuiClient();
  try {
    const clockObj = await client.getObject({
      id: CLOCK_OBJECT_ID,
      options: { showContent: true }
    });
    if (clockObj.data?.content?.dataType === 'moveObject') {
      const fields = clockObj.data.content.fields as any;
      if (fields && fields.timestamp_ms) {
        return Number(fields.timestamp_ms);
      }
    }
    return Date.now();
  } catch (err) {
    console.error('[Sui] Failed to fetch chain timestamp, defaulting to local Date.now():', err);
    return Date.now();
  }
}


// Create a publication on-chain
// Returns transaction digest
export async function createPublication(params: {
  blobId: string;
  sha256Hash: string;
  title: string;
  category: string;
  unlockAtMs: number;
  wrappedKey?: Uint8Array;
  recipient?: string;
  signAndExecute: (options: { transaction: any }) => Promise<any>; // from dapp-kit
}): Promise<{ digest: string; objectId: string }> {
  checkPackageId();

  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::publication::create_publication`,
    arguments: [
      tx.pure.vector("u8", Array.from(new TextEncoder().encode(params.blobId))),
      tx.pure.vector("u8", Array.from(new TextEncoder().encode(params.sha256Hash))),
      tx.pure.vector("u8", Array.from(new TextEncoder().encode(params.title))),
      tx.pure.vector("u8", Array.from(new TextEncoder().encode(params.category))),
      tx.pure.u64(params.unlockAtMs),
      tx.pure.vector("u8", Array.from(params.wrappedKey || new Uint8Array(0))),
      tx.pure.address(
        params.recipient || 
        '0x0000000000000000000000000000000000000000000000000000000000000000'
      ),
      tx.object(CLOCK_OBJECT_ID),
    ],
  });

  const response = await params.signAndExecute({ transaction: tx });
  console.log('[Sui] createPublication executed successfully:', response);
  
  const digest = response.digest;
  let objectId = '';

  try {
    const client = getSuiClient();
    const txResult = await client.waitForTransaction({
      digest,
      options: { showEffects: true, showObjectChanges: true }
    });
    const createdObj = txResult.objectChanges?.find(
      (c: any) => c.type === 'created' && c.objectType.includes('::publication::Publication')
    );
    if (createdObj) {
      objectId = (createdObj as any).objectId;
    } else {
      const firstCreated = txResult.objectChanges?.find((c: any) => c.type === 'created');
      objectId = (firstCreated as any)?.objectId || '';
    }
  } catch (err) {
    console.error('[Sui] Error waiting for transaction indexing details:', err);
  }

  return { digest, objectId };
}

// Try to unlock a publication
// Anyone can call this
export async function tryUnlock(
  publicationObjectId: string,
  signAndExecute: (options: { transaction: any }) => Promise<any>
): Promise<string> {
  checkPackageId();

  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::publication::try_unlock`,
    arguments: [
      tx.object(publicationObjectId),
      tx.object(CLOCK_OBJECT_ID)
    ]
  });

  const response = await signAndExecute({ transaction: tx });
  console.log(`[Sui] try_unlock transaction successful. TX Hash: ${response.digest}`);
  
  try {
    const client = getSuiClient();
    await client.waitForTransaction({ digest: response.digest });
  } catch (err) {
    console.error('[Sui] Error waiting for unlock transaction indexing:', err);
  }

  return response.digest;
}

// Get a single publication by object ID
export async function getPublication(
  objectId: string
): Promise<Publication | null> {
  checkPackageId();

  try {
    const client = getSuiClient();
    const response = await client.getObject({
      id: objectId,
      options: { showContent: true }
    });

    if (response.error || !response.data || !response.data.content) {
      console.warn(`[Sui] Object ${objectId} not found or has no content:`, response.error);
      return null;
    }

    const content = response.data.content;
    if (content.dataType !== 'moveObject') {
      return null;
    }

    const fields = content.fields as any;
    
    const blobId = fields.blob_id || fields.blobId || '';
    const sha256hash = fields.sha_256_hash || fields.sha256hash || '';
    const ownerAddr = fields.owner || fields.ownerAddr || '';
    const createdAtMs = Number(fields.created_at || fields.createdAt || 0);
    const unlockAtMs = Number(fields.unlock_at || fields.unlockAt || 0);
    const locked = fields.locked !== undefined ? fields.locked : true;
    const titleVal = fields.title || `Document ${objectId.slice(0, 10)}`;
    const categoryVal = fields.category || 'Other';
    const recipientVal = fields.recipient || '';

    let wrappedKeyBytes: Uint8Array | undefined;
    if (fields.wrapped_key) {
      if (Array.isArray(fields.wrapped_key)) {
        wrappedKeyBytes = new Uint8Array(fields.wrapped_key.map((n: any) => Number(n)));
      } else if (typeof fields.wrapped_key === 'string') {
        wrappedKeyBytes = new Uint8Array(Buffer.from(fields.wrapped_key, 'base64'));
      }
    }

    const unlockAt = unlockAtMs ? new Date(unlockAtMs).toISOString() : new Date().toISOString();
    const createdAt = createdAtMs ? new Date(createdAtMs).toISOString() : new Date().toISOString();

    return {
      id: objectId,
      title: titleVal,
      category: categoryVal,
      description: 'Decentralized document published on Sui & Walrus.',
      blobId,
      txHash: '',
      publisher: ownerAddr,
      createdAt,
      unlockAt,
      isLocked: locked,
      fileSize: 'Unknown size',
      fileType: 'application/octet-stream',
      wrappedKey: wrappedKeyBytes,
      recipient: recipientVal,
    };
  } catch (error) {
    console.error(`[Sui] Error fetching publication object ${objectId}:`, error);
    return null;
  }
}

// Get all publications by owner wallet address
// Uses Tatum RPC Gateway to fetch owned objects
export async function getPublicationsByOwner(
  ownerAddress: string
): Promise<Publication[]> {
  checkPackageId();

  try {
    const client = getSuiClient();
    
    const response = await client.getOwnedObjects({
      owner: ownerAddress,
      filter: {
        StructType: `${PACKAGE_ID}::publication::Publication`
      },
      options: {
        showContent: true
      }
    });

    const publications: Publication[] = [];
    
    for (const item of response.data) {
      if (item.data?.content?.dataType === 'moveObject') {
        const fields = item.data.content.fields as any;
        const objectId = item.data.objectId;

        const blobId = fields.blob_id || fields.blobId || '';
        const ownerAddr = fields.owner || fields.ownerAddr || '';
        const createdAtMs = Number(fields.created_at || fields.createdAt || 0);
        const unlockAtMs = Number(fields.unlock_at || fields.unlockAt || 0);
        const locked = fields.locked !== undefined ? fields.locked : true;
        const titleVal = fields.title || `Document ${objectId.slice(0, 10)}`;
        const categoryVal = fields.category || 'Other';
        const recipientVal = fields.recipient || '';

        let wrappedKeyBytes: Uint8Array | undefined;
        if (fields.wrapped_key) {
          if (Array.isArray(fields.wrapped_key)) {
            wrappedKeyBytes = new Uint8Array(fields.wrapped_key.map((n: any) => Number(n)));
          } else if (typeof fields.wrapped_key === 'string') {
            wrappedKeyBytes = new Uint8Array(Buffer.from(fields.wrapped_key, 'base64'));
          }
        }

        const unlockAt = unlockAtMs ? new Date(unlockAtMs).toISOString() : new Date().toISOString();
        const createdAt = createdAtMs ? new Date(createdAtMs).toISOString() : new Date().toISOString();

        publications.push({
          id: objectId,
          title: titleVal,
          category: categoryVal,
          description: 'Decentralized document published on Sui & Walrus.',
          blobId,
          txHash: '',
          publisher: ownerAddr,
          createdAt,
          unlockAt,
          isLocked: locked,
          fileSize: 'Unknown size',
          fileType: 'application/octet-stream',
          wrappedKey: wrappedKeyBytes,
          recipient: recipientVal,
        });
      }
    }

    return publications;
  } catch (error) {
    console.error(`[Sui] Error fetching owned publications for address ${ownerAddress}:`, error);
    return [];
  }
}

// Subscribe to SUI object notifications via Tatum Webhooks
export async function subscribeToTatumNotifications(
  objectId: string,
  webhookUrl: string
): Promise<any> {
  if (!TATUM_API_KEY) {
    console.warn("[Tatum] TATUM_API_KEY not configured, skipping notification setup");
    return null;
  }

  console.log(`[Tatum] Subscribing to SUI object events for: ${objectId} -> Webhook: ${webhookUrl}`);
  try {
    const response = await fetch("https://api.tatum.io/v4/subscription", {
      method: "POST",
      headers: {
        "x-api-key": TATUM_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: "ADDRESS_EVENT",
        attr: {
          address: objectId,
          chain: "SUI",
          url: webhookUrl
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`Tatum subscription API returned status ${response.status}: ${errText}`);
    }

    const result = await response.json();
    console.log("[Tatum] Subscription successfully registered:", result);
    return result;
  } catch (error) {
    console.error("[Tatum] Failed to create event subscription:", error);
    throw error;
  }
}
