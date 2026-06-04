// Sui Network Blockchain RPC functions & smart contract integrations using Tatum RPC
import { SuiJsonRpcClient as SuiClient, JsonRpcHTTPTransport } from '@mysten/sui/jsonRpc';
import { Transaction } from '@mysten/sui/transactions';
import { Publication } from '@/types/publication';
import { 
  TATUM_API_KEY, 
  TATUM_RPC_URL,
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


const CUSTOM_PUBS_KEY = 'deaddrop_custom_publications';

export function getCustomPublications(): Record<string, Publication> {
  if (typeof window === 'undefined') return {};
  const data = localStorage.getItem(CUSTOM_PUBS_KEY);
  return data ? JSON.parse(data) : {};
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
  signAndExecute: (options: { transaction: any }) => Promise<any>; // from dapp-kit
}): Promise<{ digest: string; objectId: string }> {
  const isMock = typeof window !== 'undefined' && window.location.search.includes('mockWallet=true');
  const isZeroPackage = PACKAGE_ID === '0x0000000000000000000000000000000000000000' || !PACKAGE_ID.startsWith('0x') || PACKAGE_ID.length < 10;
  if (isMock || isZeroPackage) {
    if (isZeroPackage) {
      console.warn('⚠️ PACKAGE_ID not set. Deploy contract and update .env.local');
    }
    if (isMock) {
      const mockObjId = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
      const mockDigest = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
      
      const newPub: Publication = {
        id: mockObjId,
        title: params.title,
        category: params.category,
        description: 'Decentralized document published on Sui & Walrus (Simulation Mode)',
        blobId: params.blobId,
        txHash: mockDigest,
        publisher: '0x' + 'f'.repeat(64),
        createdAt: new Date().toISOString(),
        unlockAt: new Date(params.unlockAtMs).toISOString(),
        isLocked: params.unlockAtMs > Date.now(),
        fileSize: 'Unknown size',
        fileType: 'application/octet-stream',
      };
      
      return { digest: mockDigest, objectId: mockObjId };
    } else {
      throw new Error('⚠️ PACKAGE_ID is not configured. Please deploy the smart contract and configure NEXT_PUBLIC_PACKAGE_ID.');
    }
  }

  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::publication::create_publication`,
    arguments: [
      tx.pure.string(params.blobId),
      tx.pure.string(params.sha256Hash),
      tx.pure.string(params.title),
      tx.pure.string(params.category),
      tx.pure.u64(params.unlockAtMs),
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
// tryUnlock() is available but NOT called 
// from the verify page UI.
// It can be called manually by the publisher
// from their dashboard if they want to 
// update the on-chain locked field.
// The verify page determines accessibility
// client-side using the unlockAt timestamp.
export async function tryUnlock(
  publicationObjectId: string,
  signAndExecute: (options: { transaction: any }) => Promise<any>
): Promise<string> {
  const isZeroPackage = PACKAGE_ID === '0x0000000000000000000000000000000000000000' || !PACKAGE_ID.startsWith('0x') || PACKAGE_ID.length < 10;
  if (isZeroPackage) {
    console.warn('⚠️ PACKAGE_ID not set. Deploy contract and update .env.local');
    const isMock = typeof window !== 'undefined' && window.location.search.includes('mockWallet=true');
    if (isMock) {
      const customPubs = getCustomPublications();
      if (customPubs[publicationObjectId]) {
        customPubs[publicationObjectId].isLocked = false;
        localStorage.setItem(CUSTOM_PUBS_KEY, JSON.stringify(customPubs));
      }
      return '0x_mock_unlock_digest';
    }
    throw new Error('⚠️ PACKAGE_ID is not configured. Please deploy the smart contract and configure NEXT_PUBLIC_PACKAGE_ID.');
  }

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
    const customPubs = getCustomPublications();
    if (customPubs[publicationObjectId]) {
      customPubs[publicationObjectId].isLocked = false;
      localStorage.setItem(CUSTOM_PUBS_KEY, JSON.stringify(customPubs));
    }
  } catch (err) {
    console.error('[Sui] Error waiting for unlock transaction indexing:', err);
  }

  return response.digest;
}

// Get a single publication by object ID
export async function getPublication(
  objectId: string
): Promise<Publication | null> {
  const cachedPubs = getCustomPublications();
  const cachedPub = cachedPubs[objectId];

  const isZeroPackage = PACKAGE_ID === '0x0000000000000000000000000000000000000000' || !PACKAGE_ID.startsWith('0x') || PACKAGE_ID.length < 10;
  if (isZeroPackage) {
    console.warn('⚠️ PACKAGE_ID not set. Deploy contract and update .env.local');
    return cachedPub || null;
  }

  try {
    const client = getSuiClient();
    const response = await client.getObject({
      id: objectId,
      options: { showContent: true }
    });

    if (response.error || !response.data || !response.data.content) {
      console.warn(`[Sui] Object ${objectId} not found or has no content:`, response.error);
      return cachedPub || null;
    }

    const content = response.data.content;
    if (content.dataType !== 'moveObject') {
      return cachedPub || null;
    }

    const fields = content.fields as any;
    
    const blobId = fields.blob_id || fields.blobId || cachedPub?.blobId || '';
    const sha256hash = fields.sha_256_hash || fields.sha256hash || '';
    const ownerAddr = fields.owner || fields.ownerAddr || cachedPub?.publisher || '';
    const createdAtMs = Number(fields.created_at || fields.createdAt || 0);
    const unlockAtMs = Number(fields.unlock_at || fields.unlockAt || 0);
    const locked = fields.locked !== undefined ? fields.locked : (cachedPub?.isLocked ?? true);
    const titleVal = fields.title || cachedPub?.title || `Document ${objectId.slice(0, 10)}`;
    const categoryVal = fields.category || cachedPub?.category || 'Other';

    const unlockAt = unlockAtMs ? new Date(unlockAtMs).toISOString() : (cachedPub?.unlockAt || new Date().toISOString());
    const createdAt = createdAtMs ? new Date(createdAtMs).toISOString() : (cachedPub?.createdAt || new Date().toISOString());

    return {
      id: objectId,
      title: titleVal,
      category: categoryVal,
      description: cachedPub?.description || 'Decentralized document published on Sui & Walrus.',
      blobId,
      txHash: cachedPub?.txHash || '',
      publisher: ownerAddr,
      createdAt,
      unlockAt,
      isLocked: locked,
      fileSize: cachedPub?.fileSize || 'Unknown size',
      fileType: cachedPub?.fileType || 'application/octet-stream',
    };
  } catch (error) {
    console.error(`[Sui] Error fetching publication object ${objectId}:`, error);
    return cachedPub || null;
  }
}

// Get all publications by owner wallet address
// Uses Tatum Data API / getOwnedObjects
export async function getPublicationsByOwner(
  ownerAddress: string
): Promise<Publication[]> {
  const customPubs = Object.values(getCustomPublications()).filter(
    (p) => p.publisher.toLowerCase() === ownerAddress.toLowerCase()
  );

  const isZeroPackage = PACKAGE_ID === '0x0000000000000000000000000000000000000000' || !PACKAGE_ID.startsWith('0x') || PACKAGE_ID.length < 10;
  if (isZeroPackage) {
    console.warn('⚠️ PACKAGE_ID not set. Deploy contract and update .env.local');
    return customPubs;
  }

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
        const cachedPub = customPubs.find(p => p.id === objectId);

        const blobId = fields.blob_id || fields.blobId || cachedPub?.blobId || '';
        const sha256hash = fields.sha_256_hash || fields.sha256hash || '';
        const ownerAddr = fields.owner || fields.ownerAddr || cachedPub?.publisher || '';
        const createdAtMs = Number(fields.created_at || fields.createdAt || 0);
        const unlockAtMs = Number(fields.unlock_at || fields.unlockAt || 0);
        const locked = fields.locked !== undefined ? fields.locked : (cachedPub?.isLocked ?? true);
        const titleVal = fields.title || cachedPub?.title || `Document ${objectId.slice(0, 10)}`;
        const categoryVal = fields.category || cachedPub?.category || 'Other';

        const unlockAt = unlockAtMs ? new Date(unlockAtMs).toISOString() : (cachedPub?.unlockAt || new Date().toISOString());
        const createdAt = createdAtMs ? new Date(createdAtMs).toISOString() : (cachedPub?.createdAt || new Date().toISOString());

        publications.push({
          id: objectId,
          title: titleVal,
          category: categoryVal,
          description: cachedPub?.description || 'Decentralized document published on Sui & Walrus.',
          blobId,
          txHash: cachedPub?.txHash || '',
          publisher: ownerAddr,
          createdAt,
          unlockAt,
          isLocked: locked,
          fileSize: cachedPub?.fileSize || 'Unknown size',
          fileType: cachedPub?.fileType || 'application/octet-stream',
        });
      }
    }

    // Merge custom localstorage mock publications that aren't already fetched from chain
    for (const cp of customPubs) {
      if (!publications.some(p => p.id === cp.id)) {
        publications.push(cp);
      }
    }

    return publications;
  } catch (error) {
    console.error(`[Sui] Error fetching owned publications for address ${ownerAddress}:`, error);
    return customPubs;
  }
}
