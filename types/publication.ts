export interface Publication {
  id: string; // Sui Object ID or unique publication hash
  title: string;
  category: string;
  description?: string;
  blobId: string; // Walrus Blob ID (base58)
  txHash: string; // Sui Transaction Hash
  publisher: string; // Sui Address
  createdAt: string; // ISO String
  unlockAt: string; // ISO String
  isLocked: boolean;
  fileSize?: string;
  fileType?: string;
  decryptionKey?: string; // Generated client-side key for unlocked items
}

export type Category = 
  | "Investigative Report"
  | "Legal Document"
  | "Contract"
  | "Evidence"
  | "Personal Record"
  | "Other";

export interface PublishParams {
  title: string;
  category: string;
  description: string;
  file: File;
  unlockAt: string; // ISO string representing unlock time
}

export interface PublishResult {
  objectId: string;
  blobId: string;
  transactionDigest: string;
  decryptionKey: string;
}
