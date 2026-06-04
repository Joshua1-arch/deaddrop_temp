import { Publication } from "@/types/publication";

export const WALRUS_PUBLISHER_URL = "https://publisher.walrus-testnet.walrus.space";
export const WALRUS_AGGREGATOR_URL = "https://aggregator.walrus-testnet.walrus.space";
export const SUI_RPC_URL = "https://sui-mainnet.gateway.tatum.io/";

// Realistic Mock Data for UI demonstration
export const MOCK_PUBLISHER_ADDRESS = "0x789b52a1c0d48f93e32c81e9f012a456b3cd1278e90ab12c456df789a012bc34";

export const MOCK_PUBLICATIONS: Record<string, Publication> = {
  "locked-demo": {
    id: "0x3c2a9b4d8e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
    title: "q3_internal_roadmap.pdf",
    category: "Investigative Report",
    description: "Confidential corporate expansion plans and financial forecast projections for Q3 and Q4.",
    blobId: "4zV4A2hC5g1K6fL8mN0pQ2rS4tU6vW8xY0zA2bC4dEfG",
    txHash: "7yH9jK1mL3nP5qR7sT9uV2wX4yZ6aB8cDeFgHjKlMnPq",
    publisher: MOCK_PUBLISHER_ADDRESS,
    createdAt: new Date(Date.now() - 3600 * 24 * 1000 * 2).toISOString(), // 2 days ago
    unlockAt: new Date(Date.now() + 3600 * 24 * 1000 * 5).toISOString(), // 5 days from now
    isLocked: true,
    fileSize: "4.2 MB",
    fileType: "application/pdf"
  },
  "unlocked-demo": {
    id: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    title: "Manifesto_Draft_2024.pdf",
    category: "Evidence",
    description: "Public interest disclosure containing leaked text messages and emails regarding corporate corruption.",
    blobId: "8xY0zA2bC4dEfG6hI8jK0lM2nP4qR6sT8uV0wX2yZ4aB",
    txHash: "5qR7sT9uV2wX4yZ6aB8cDeFgHjKlMnPqRsTuVwXyZ1a",
    publisher: MOCK_PUBLISHER_ADDRESS,
    createdAt: new Date(Date.now() - 3600 * 24 * 1000 * 10).toISOString(), // 10 days ago
    unlockAt: new Date(Date.now() - 3600 * 24 * 1000 * 1).toISOString(), // 1 day ago
    isLocked: false,
    fileSize: "1.8 MB",
    fileType: "application/pdf",
    decryptionKey: "dd-key-4f2a-b9c8-0d1e-2f3a-4b5c-6d7e"
  }
};

export const MOCK_DASHBOARD_PUBLICATIONS: Publication[] = [
  MOCK_PUBLICATIONS["locked-demo"],
  MOCK_PUBLICATIONS["unlocked-demo"],
  {
    id: "0x9876543210abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    title: "Acquisition_Agreement_Final.docx",
    category: "Contract",
    description: "Signed acquisition agreement between parent company and affiliate entities.",
    blobId: "3mN0pQ2rS4tU6vW8xY0zA2bC4dEfG6hI8jK0lM2nP4qR",
    txHash: "8cDeFgHjKlMnPqRsTuVwXyZ1a2b3c4d5e6f7a8b9c0d",
    publisher: MOCK_PUBLISHER_ADDRESS,
    createdAt: new Date(Date.now() - 3600 * 24 * 1000 * 30).toISOString(),
    unlockAt: new Date(Date.now() - 3600 * 24 * 1000 * 15).toISOString(),
    isLocked: false,
    fileSize: "2.1 MB",
    fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    decryptionKey: "dd-key-a1b2-c3d4-e5f6-7g8h-9i0j-1k2l"
  },
  {
    id: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    title: "whistleblower_incident_photos.zip",
    category: "Evidence",
    description: "Photographic evidence of environmental degradation around illegal dumping site.",
    blobId: "5qR7sT9uV2wX4yZ6aB8cDeFgHjKlMnPqRsTuVwXyZ1a2b",
    txHash: "9aB8cDeFgHjKlMnPqRsTuVwXyZ1a2b3c4d5e6f7a8b9",
    publisher: MOCK_PUBLISHER_ADDRESS,
    createdAt: new Date(Date.now() - 3600 * 24 * 1000 * 1).toISOString(),
    unlockAt: new Date(Date.now() + 3600 * 24 * 1000 * 30).toISOString(),
    isLocked: true,
    fileSize: "24.5 MB",
    fileType: "application/zip"
  }
];

export const TATUM_RPC_URL = 'https://sui-testnet.gateway.tatum.io';
export const TATUM_API_KEY = process.env.NEXT_PUBLIC_TATUM_API_KEY || '';
export const TATUM_DATA_API_URL = 'https://api.tatum.io/v4';
export const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || "0xd091f0bbb8ec8e0dd1de59f430572dfd8e08ff8938b2cb7b751af496eb51b902";
export const CLOCK_OBJECT_ID = "0x6";

