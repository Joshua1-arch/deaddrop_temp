# 💀 DeadDrop: Censorship-Resistant Time-Lock Document Publishing

> **Tagline**: Secure, trustless, client-side encrypted document leaks anchored on Sui and stored on Walrus with cryptographic time-lock guarantees.

---

## ⚠️ The Problem

Whistleblowers, journalists, and vulnerable sources face extreme risks when releasing sensitive, high-impact information:
1. **Centralized Exposure**: Storing sensitive leaks on standard servers exposes sources to subpoena, physical raid, or host takedown.
2. **Premature Exposure**: Releasing data too early can derail investigative campaigns or tip off malicious entities.
3. **Data Tampering & Modification**: Traditional file-sharing hosts can alter document contents, destroy evidence, or retroactively inject backdoors.
4. **Active Tracking**: Third-party databases log IP addresses, access tokens, and traffic details, Deanonymizing sources.

---

## 🛡️ The Solution: DeadDrop

DeadDrop is a decentralized, zero-server time-lock publishing platform. It leverages browser-native AES-256-GCM encryption, Walrus storage network segments, and Sui smart contracts to guarantee files remain unreadable until a precise, immutable block timestamp.

```mermaid
graph TD
    A[Source File] --> B[Generate AES-256 Key]
    B --> C[Encrypt File Client-Side]
    C --> D[Upload Encrypted Payload to Walrus]
    D -->|Blob ID| E[Anchor Certificate on Sui Blockchain]
    E -->|Time Seal Object| F[DeadDrop Publication Created]
    F -->|Time Elapsed| G[Unlock via Clock Object]
    G --> H[Retrieve Blob & Decrypt Client-Side]
```

---

## 📝 Project Details

### What DeadDrop Does
DeadDrop is a secure, completely client-side encrypted publishing protocol designed for high-stakes whistleblowing, anonymous leaks, and digital contracts. It allows publishers to upload confidential documents with a specific time seal, ensuring the contents cannot be read or compromised by any party (including DeadDrop developers) before the time lock expires. 

Once the time lock is reached, the transaction on the Sui blockchain is eligible for unlock using the native Sui System Clock. When unlocked, verification pages retrieve the encrypted data blocks from the decentralized storage network and decrypt them client-side using the publisher's key. This flow provides mathematical guarantee of release times without relying on centralized timekeepers or databases.

### How Walrus is Used as Core Storage
Walrus serves as DeadDrop's primary, decentralized storage tier. Instead of persisting sensitive files on centralized cloud platforms or single-point web hosts, DeadDrop encrypts documents client-side using AES-256-GCM and uploads the resulting ciphertext binary directly to the Walrus Testnet. 

The storage network processes the payload, breaking it down into redundant fragments distributed across independent storage nodes. Whistleblowers receive a base58-encoded `Blob ID`, representing a decentralized pointer. This guarantees absolute censorship resistance and high availability; no government, host provider, or single entity can delete or modify the leaked document.

### How Tatum RPC + Data API is Used
Tatum provides the high-performance RPC gateway infrastructure for DeadDrop's client-side interactions with the Sui Testnet. To bypass CORS issues arising from the browser appending proprietary SDK telemetry headers (which trigger preflight check failures on standard gateways), DeadDrop routes all browser RPC queries through a custom Next.js server-side endpoint. 

This proxy securely appends the Tatum API key and forwards clean requests to Tatum's Sui RPC gateway. Furthermore, Tatum’s indexer and node connections facilitate querying on-chain transaction logs, monitoring contract states, and displaying active publications under the user's dashboard in real-time.

### How the Time-Lock Works on Sui
The core trust-minimization engine of DeadDrop is built on the Sui blockchain using a custom Move smart contract. When a publisher commits a document, the client-side wallet executes a transaction that registers a `Publication` object on-chain. This object records the Walrus Blob ID, the real SHA-256 hash of the original document, and the exact timestamp threshold after which the document becomes public.

Crucially, the decryption key is kept strictly by the user during the time-lock and never persistent on-chain or on any server. The Move contract references the immutable, system-level `sui::clock::Clock` object to evaluate unlock eligibility. Any attempt to query or decrypt the document prior to the specified timestamp is rejected on-chain, guaranteeing that the embargo is mathematically enforced.

---

## ⚡ Key Features

- **Zero-Server Client-Side Cryptography**: Key generation, encryption, and decryption happen strictly in the browser using the Web Crypto API. The raw document never leaves the publisher's system unencrypted.
- **Censorship-Resistant Storage**: Encrypted blobs are distributed across the Walrus decentralized network, preventing content erasure or host takeovers.
- **On-Chain Clock Time-Locks**: Lock parameters are anchored immutably in a Sui Move contract. The release schedule is guaranteed by the Sui system `Clock` object, making premature decryption mathematically impossible.
- **Premium UX Dashboard**: Responsive, highly polished dashboard with real-time status badges, search/filter capabilities, live countdown timers, and automatic transaction triggers on expiration.
- **Multi-Format Magic Bytes Decoder**: Decrypted files are inspected via magic bytes in the browser. PDFs are opened in secure view tabs, images display directly in the UI, and documents render in styled clean readers.

---

## 🔌 Endpoints & Integration Configuration

### Hackathon Metadata
- **Live demo**: http://localhost:3000 (local)
- **Contract**: https://suiscan.xyz/testnet/package/0xd091f0bbb8ec8e0dd1de59f430572dfd8e08ff8938b2cb7b751af496eb51b902
- **Deployment TX**: https://suiscan.xyz/testnet/tx/583zXh94pftxbTejvU3vCZQ1WzR4FnAG4xVyKQ8SP4Hu

### Walrus Testnet Nodes
- **Publisher Node**: `https://publisher.walrus-testnet.walrus.space` (PUT uploads)
- **Aggregator Node**: `https://aggregator.walrus-testnet.walrus.space` (GET downloads)

### Tatum Sui Gateway
- **RPC Endpoint**: `https://sui-testnet.gateway.tatum.io/`

### Move Smart Contract Package
- **Sui Testnet Package ID**: `0xd091f0bbb8ec8e0dd1de59f430572dfd8e08ff8938b2cb7b751af496eb51b902`
- **System Clock ID**: `0x6`
