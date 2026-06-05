"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Wallet,
  FileText,
  ShieldCheck,
  LayoutDashboard,
  Lock,
  Unlock,
  Key,
  Database,
  Layers,
  ArrowRight,
  Code,
  Terminal,
  Cpu,
  Info,
  Clock,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

type SectionId = "overview" | "wallet" | "publish" | "verify" | "dashboard" | "security";

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<SectionId>("overview");

  const sections: { id: SectionId; name: string; icon: any }[] = [
    { id: "overview", name: "1. Overview & Architecture", icon: BookOpen },
    { id: "wallet", name: "2. Wallet & Secure Inbox", icon: Wallet },
    { id: "publish", name: "3. Publishing & Key Wrapping", icon: FileText },
    { id: "verify", name: "4. Verifying & Decrypting", icon: ShieldCheck },
    { id: "dashboard", name: "5. Dashboard & Webhooks", icon: LayoutDashboard },
    { id: "security", name: "6. Zero-Knowledge Guarantees", icon: Lock },
  ];

  return (
    <div className="flex-1 flex flex-col hero-radial-glow">
      {/* Header Banner */}
      <section className="border-b border-white/5 py-12 px-4 md:px-8 bg-background-secondary/20">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-primary/10 border border-accent-primary/20 rounded-full text-xs font-semibold text-accent-primary select-none">
            <BookOpen size={12} />
            DeadDrop Protocol Guide
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
            Technical Documentation
          </h1>
          <p className="text-sm md:text-base text-text-secondary max-w-2xl leading-relaxed">
            Understand the zero-server architecture, client-side cryptography, Sui Move smart contracts, and Walrus storage integrations powering DeadDrop.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8 flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar Navigation */}
        <aside className="lg:col-span-1 space-y-2 lg:sticky lg:top-24 h-fit">
          <div className="bg-background-card border border-white/5 rounded-xl p-4 space-y-1 shadow-xl">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted px-3 mb-2 block">
              Documentation Chapters
            </span>
            {sections.map((sec) => {
              const Icon = sec.icon;
              const isSelected = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-300 text-left ${
                    isSelected
                      ? "bg-accent-primary text-background-primary shadow-accent-glow"
                      : "text-text-secondary hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={14} className={isSelected ? "text-background-primary" : "text-text-secondary"} />
                    <span>{sec.name}</span>
                  </div>
                  <ChevronRight size={12} className={isSelected ? "text-background-primary" : "text-text-muted"} />
                </button>
              );
            })}
          </div>

          <div className="bg-background-card/50 border border-white/5 rounded-xl p-4 space-y-3 shadow-lg">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Cpu size={12} className="text-accent-secondary" />
              On-Chain Contract
            </h4>
            <div className="space-y-1 font-mono text-[10px] text-text-secondary leading-relaxed">
              <div>Sui Testnet Package:</div>
              <a
                href="https://suiscan.xyz/testnet/package/0xff2897d07079e53a77857c3d61bd8262cc69c2e9f21fb8fb1645110ed5e4164e"
                target="_blank"
                rel="noreferrer"
                className="text-accent-secondary hover:underline truncate block"
              >
                0xff2897d07079e53a77857c3d61bd8262cc69c2e9f21fb8fb1645110ed5e4164e
              </a>
            </div>
            <div className="h-px bg-white/5"></div>
            <div className="flex justify-between items-center text-[10px] font-mono text-text-secondary">
              <span>Sui Clock Object:</span>
              <span className="text-white">0x6</span>
            </div>
          </div>
        </aside>

        {/* Right Content Area */}
        <section className="lg:col-span-3 bg-background-card border border-white/5 rounded-2xl p-6 md:p-10 shadow-2xl space-y-8 animate-fadeIn">
          
          {/* Chapter 1: Overview */}
          {activeSection === "overview" && (
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
                  <BookOpen className="text-accent-primary" size={24} />
                  Overview & Architecture
                </h2>
                <div className="h-0.5 w-12 bg-accent-primary rounded-full"></div>
              </div>

              <p className="text-sm text-text-secondary leading-relaxed">
                Whistleblowers, investigative journalists, and parties signing time-lock digital agreements face severe threat models: centralized database server seizures, file tampering, host provider takedowns, and tracking.
              </p>

              <div className="bg-background-secondary border border-white/5 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database size={16} className="text-accent-secondary" />
                  DeadDrop&apos;s Core Solutions
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <li className="space-y-1 p-3 bg-background-primary/50 border border-white/5 rounded-lg">
                    <span className="font-semibold text-white block">Censorship-Resistant Storage</span>
                    <span className="text-text-secondary leading-relaxed">Files are stored on <strong>Walrus Protocol</strong>, a decentralized storage network, preventing server seizures and single-point deletions.</span>
                  </li>
                  <li className="space-y-1 p-3 bg-background-primary/50 border border-white/5 rounded-lg">
                    <span className="font-semibold text-white block">Consensus Time-Locks</span>
                    <span className="text-text-secondary leading-relaxed">Release timestamps are written permanently to <strong>Sui blockchain</strong> smart contracts and evaluated using immutable validators.</span>
                  </li>
                  <li className="space-y-1 p-3 bg-background-primary/50 border border-white/5 rounded-lg">
                    <span className="font-semibold text-white block">Zero-Server Cryptography</span>
                    <span className="text-text-secondary leading-relaxed">All keys are generated and documents encrypted using browser sandbox APIs. The raw document never traverses our servers.</span>
                  </li>
                  <li className="space-y-1 p-3 bg-background-primary/50 border border-white/5 rounded-lg">
                    <span className="font-semibold text-white block">In-Browser Magic Bytes Decoder</span>
                    <span className="text-text-secondary leading-relaxed">Decrypted file bytes are parsed in real time in-browser to identify and securely render PDFs, images, and texts.</span>
                  </li>
                </ul>
              </div>

              {/* Protocol Flowchart */}
              <div className="border border-white/5 bg-background-secondary rounded-xl p-6 space-y-6">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">
                  DeadDrop Sequence Diagram
                </h4>
                
                {/* Visual Sequence Chart */}
                <div className="space-y-4 font-sans text-xs">
                  <div className="flex items-start gap-4 p-3 bg-background-primary border-l-2 border-accent-primary rounded">
                    <span className="font-mono text-accent-primary font-bold">01</span>
                    <div className="space-y-0.5">
                      <strong className="text-white block">Local Encryption</strong>
                      <span className="text-text-secondary">The publisher drops a file. Browser generates a random AES-256 key and encrypts the file bytes client-side.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-3 bg-background-primary border-l-2 border-accent-secondary rounded">
                    <span className="font-mono text-accent-secondary font-bold">02</span>
                    <div className="space-y-0.5">
                      <strong className="text-white block">Walrus Blob Upload</strong>
                      <span className="text-text-secondary">The encrypted ciphertext (and IV) is uploaded directly to Walrus Testnet, generating a unique, base58-encoded Blob ID.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-3 bg-background-primary border-l-2 border-accent-primary rounded">
                    <span className="font-mono text-accent-primary font-bold">03</span>
                    <div className="space-y-0.5">
                      <strong className="text-white block">Sui Registry Minting</strong>
                      <span className="text-text-secondary">The publisher signs a Sui transaction, registering a `Publication` object mapping the Blob ID, the real SHA-256 file hash, and lock timestamp.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-3 bg-background-primary border-l-2 border-accent-secondary rounded">
                    <span className="font-mono text-accent-secondary font-bold">04</span>
                    <div className="space-y-0.5">
                      <strong className="text-white block">Consensus Time Verification</strong>
                      <span className="text-text-secondary">Decryption is blocked until the Sui system clock exceeds the time seal threshold, unlocking the object on-chain.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Integration Grid */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white">Technological Infrastructure</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-sans">
                    <thead>
                      <tr className="border-b border-white/5 text-text-secondary uppercase tracking-wider font-mono text-[10px]">
                        <th className="py-2.5">Component</th>
                        <th className="py-2.5">Integration Platform</th>
                        <th className="py-2.5">Role inside Protocol</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-text-secondary">
                      <tr>
                        <td className="py-3 font-semibold text-white">Blockchain Consensus</td>
                        <td className="py-3">Sui Testnet</td>
                        <td className="py-3">Enforces time-locks immutably via custom Move contract using validator clocks.</td>
                      </tr>
                      <tr>
                        <td className="py-3 font-semibold text-white">Decentralized Storage</td>
                        <td className="py-3">Walrus Protocol (Mysten Labs)</td>
                        <td className="py-3">Disperses encrypted document segments across nodes, ensuring high redundancy.</td>
                      </tr>
                      <tr>
                        <td className="py-3 font-semibold text-white">Network RPC Gateway</td>
                        <td className="py-3">Tatum Sui Gateway</td>
                        <td className="py-3">Handles client ledger updates and queries through secure CORS routing.</td>
                      </tr>
                      <tr>
                        <td className="py-3 font-semibold text-white">Client Cryptography</td>
                        <td className="py-3">Web Crypto API</td>
                        <td className="py-3">Implements local AES-256-GCM encryption and ECIES (ECDH P-256 key wrapping).</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Chapter 2: Wallet Setup */}
          {activeSection === "wallet" && (
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
                  <Wallet className="text-accent-primary" size={24} />
                  Wallet Connection & Secure Inbox
                </h2>
                <div className="h-0.5 w-12 bg-accent-primary rounded-full"></div>
              </div>

              <p className="text-sm text-text-secondary leading-relaxed">
                DeadDrop connects to the Sui network using the official <code>@mysten/dapp-kit</code> provider. This allows compatibility with popular Sui wallets (Sui Wallet, Surf Wallet, etc.). Additionally, for developer testing and judging, the application includes an automated mock-wallet system initialized via URL params.
              </p>

              {/* Secure Inbox Activation */}
              <div className="bg-background-secondary border border-white/5 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Key size={16} className="text-accent-secondary" />
                  <h3>Signature-Derived Secure Inbox Activation</h3>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Sui wallets natively support message signing but lack direct decryptions APIs. To enable wallet-to-wallet file drops, DeadDrop utilizes a custom profile derivation mechanism:
                </p>
                <ol className="list-decimal list-inside text-xs text-text-secondary space-y-2 pl-2">
                  <li>
                    The user clicks <strong>&quot;Activate Inbox&quot;</strong> on the Dashboard.
                  </li>
                  <li>
                    The wallet prompts the user to sign a static verification message: <code>&quot;Activate DeadDrop Inbox v1&quot;</code>.
                  </li>
                  <li>
                    The resulting signature bytes are hashed using SHA-256 to seed a local, browser-based <strong>ECDH P-256 keypair</strong>.
                  </li>
                  <li>
                    The browser encrypts the P-256 private key (PKCS#8 format) using the signature hash (AES-256-GCM).
                  </li>
                  <li>
                    The application triggers a transaction on Sui to register a <code>DEADDROP_PROFILE</code>. It stores the P-256 public key (as raw bytes) in the object&apos;s <code>wrapped_key</code> metadata, and the encrypted private key hex string in the <code>blob_id</code> parameter.
                  </li>
                </ol>
              </div>

              {/* Cryptography Code Snippet */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">
                  Deriving Cryptographic Keys from Signatures
                </h4>
                <div className="bg-background-primary border border-white/5 rounded-lg p-4 font-mono text-[11px] text-accent-primary overflow-x-auto">
                  <pre>{`// Derive symmetric wrapping key from wallet message signature
export async function deriveKeyFromSignature(signatureBytes: Uint8Array): Promise<CryptoKey> {
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', signatureBytes);
  return globalThis.crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}`}</pre>
                </div>
              </div>

              {/* Developer Tip */}
              <div className="flex items-start gap-3 p-4 bg-accent-secondary/5 border border-accent-secondary/20 rounded-xl text-xs text-text-secondary">
                <Info size={16} className="text-accent-secondary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="text-white">Developer Testing Tip: Mocking Wallets</strong>
                  <p>
                    You can append <code>?mockWallet=true</code> to the URL query to connect a pre-funded mock developer wallet, bypassing wallet installs while retaining all features (signature derivation, transaction routing, etc.).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Chapter 3: Publishing */}
          {activeSection === "publish" && (
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
                  <FileText className="text-accent-primary" size={24} />
                  Publishing & ECIES Key Wrapping
                </h2>
                <div className="h-0.5 w-12 bg-accent-primary rounded-full"></div>
              </div>

              <p className="text-sm text-text-secondary leading-relaxed">
                The multi-step publishing wizard encrypts the whistleblower&apos;s file client-side, splits it on Walrus, and creates the Sui ledger entry.
              </p>

              {/* Multi-Step Flow details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-background-secondary border border-white/5 rounded-xl space-y-2">
                  <div className="text-accent-primary font-bold text-xs uppercase tracking-wider">Step 1: Document drop</div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Select a document, title, category, description, and configure access settings. You can set the file as public (anyone with the decryption key can view) or restricted (intended for a specific wallet address).
                  </p>
                </div>
                <div className="p-4 bg-background-secondary border border-white/5 rounded-xl space-y-2">
                  <div className="text-accent-secondary font-bold text-xs uppercase tracking-wider">Step 2: Time seal</div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Define the embargo release period (Now, 30 days, 1 year, or a custom calendar timestamp). Optionally register a Tatum webhook url to receive immediate on-chain mutation notification alerts.
                  </p>
                </div>
                <div className="p-4 bg-background-secondary border border-white/5 rounded-xl space-y-2">
                  <div className="text-accent-primary font-bold text-xs uppercase tracking-wider">Step 3: Execute</div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Verify payload parameters and execute the transaction in the connected wallet. This encrypts the document, uploads the ciphertext to Walrus, and mints the publication object on Sui.
                  </p>
                </div>
              </div>

              {/* ECIES Key Wrapping */}
              <div className="bg-background-secondary border border-white/5 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Lock size={16} className="text-accent-secondary" />
                  ECDH Ephemeral Key Wrapping (ECIES)
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  When publishing to a specific recipient address, the publisher&apos;s client automatically wraps the file&apos;s symmetric key:
                </p>
                <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 pl-2">
                  <li>The app queries Sui for the recipient&apos;s <code>DEADDROP_PROFILE</code> public key.</li>
                  <li>The app generates an ephemeral P-256 key pair.</li>
                  <li>An ECDH shared secret is derived using the ephemeral private key and the recipient&apos;s public key.</li>
                  <li>The document&apos;s AES key is encrypted using the shared secret.</li>
                  <li>The final wrapped metadata package <code>[ephemeralPublicKey (65 bytes) || iv (12 bytes) || encryptedAESKey]</code> is saved in the Sui publication&apos;s <code>wrapped_key</code> property.</li>
                </ul>
              </div>

              {/* Cryptography Code Snippet */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">
                  Key wrapping code snippet
                </h4>
                <div className="bg-background-primary border border-white/5 rounded-lg p-4 font-mono text-[11px] text-accent-primary overflow-x-auto">
                  <pre>{`// Encrypt the AES key with recipient's public key using ECDH + AES-256-GCM
export async function wrapKeyForRecipient(
  aesKeyString: string,
  recipientPublicKeyBytes: Uint8Array
): Promise<Uint8Array> {
  // 1. Generate ephemeral ECDH key pair
  const ephemeralKeyPair = await globalThis.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey']
  );
  // 2. Import recipient public key & derive shared secret via ECDH
  const recipientPublicKey = await globalThis.crypto.subtle.importKey(
    'raw', recipientPublicKeyBytes, { name: 'ECDH', namedCurve: 'P-256' }, false, []
  );
  const sharedSecret = await globalThis.crypto.subtle.deriveKey(
    { name: 'ECDH', public: recipientPublicKey }, ephemeralKeyPair.privateKey,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt']
  );
  // 3. Encrypt AES key string, export ephemeral pub key, and concat bytes
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const keyBytes = new TextEncoder().encode(aesKeyString);
  const encryptedKey = await globalThis.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, sharedSecret, keyBytes);
  const ephemeralPublicKeyBytes = await globalThis.crypto.subtle.exportKey('raw', ephemeralKeyPair.publicKey);
  const result = new Uint8Array(65 + 12 + encryptedKey.byteLength);
  result.set(new Uint8Array(ephemeralPublicKeyBytes), 0);
  result.set(iv, 65);
  result.set(new Uint8Array(encryptedKey), 77);
  return result;
}`}</pre>
                </div>
              </div>

              {/* Zero-Knowledge Backup */}
              <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-xs text-text-secondary space-y-2">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Info size={16} className="text-danger" />
                  <span>Mandatory Decryption Key Backup</span>
                </div>
                <p className="leading-relaxed">
                  Due to our strict zero-knowledge architecture, the decryption key is only generated in the user&apos;s browser. We never log or transmit it. If the key is lost, the document can never be decrypted. During step 4 (Success), a non-dismissible modal overlay intercepts close and refresh triggers (using the browser&apos;s <code>beforeunload</code> window event handler) until the user downloads or copies the key.
                </p>
              </div>
            </div>
          )}

          {/* Chapter 4: Verifying */}
          {activeSection === "verify" && (
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
                  <ShieldCheck className="text-accent-primary" size={24} />
                  Verifying & Decrypting Documents
                </h2>
                <div className="h-0.5 w-12 bg-accent-primary rounded-full"></div>
              </div>

              <p className="text-sm text-text-secondary leading-relaxed">
                Verification pages query the Sui blockchain for the document&apos;s cryptographic certificate, enforce the time seal, and execute client-side decryption.
              </p>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white">Verification Page Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-background-secondary border border-white/5 rounded-xl space-y-2">
                    <strong className="text-white block flex items-center gap-1.5">
                      <Clock size={14} className="text-accent-primary" />
                      Consensus Clock Check
                    </strong>
                    <span className="text-text-secondary leading-relaxed">
                      Reads the <code>unlock_at</code> timestamp. If the timer is active, decryption inputs are blocked. The release schedule is guaranteed by the Move contract querying the system clock.
                    </span>
                  </div>
                  <div className="p-4 bg-background-secondary border border-white/5 rounded-xl space-y-2">
                    <strong className="text-white block flex items-center gap-1.5">
                      <Code size={14} className="text-accent-secondary" />
                      Hash Integrity Checking
                    </strong>
                    <span className="text-text-secondary leading-relaxed">
                      Displays the <code>sha256_hash</code> stored on-chain. When decrypted, the browser hashes the file and verifies matches, guarding against Walrus node data tampering.
                    </span>
                  </div>
                </div>
              </div>

              {/* Decryption Types */}
              <div className="bg-background-secondary border border-white/5 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white">How Decryption Works</h3>
                
                <div className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <span className="font-semibold text-white block">A. Public Documents (Manual Key Input)</span>
                    <p className="text-text-secondary leading-relaxed">
                      The user inputs the decryption key. The page downloads the ciphertext bytes from Walrus Aggregators, strips the 12-byte IV prepended at the start, and calls <code>crypto.subtle.decrypt</code>. If the key is stored on-chain in <code>decryptionKey</code> (e.g. instantly public documents), the page auto-populates the input, allowing 1-click access.
                    </p>
                  </div>
                  
                  <div className="space-y-1.5">
                    <span className="font-semibold text-white block">B. Restricted Documents (Wallet-to-Wallet Auto-Decryption)</span>
                    <p className="text-text-secondary leading-relaxed">
                      If the document was locked for a specific recipient, the recipient connects their wallet to the verification route. They click <strong>&quot;Decrypt with My Wallet&quot;</strong> and sign a message. The signature derives the AES key, decrypting their local P-256 private key stored on Sui. The private key performs an ECDH key exchange with the ephemeral public key from the on-chain <code>wrappedKey</code> array, deriving the shared secret to decrypt the AES key, unlocking the document instantly.
                    </p>
                  </div>
                </div>
              </div>

              {/* Magic Bytes Decoder */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white">Multi-Format Magic Bytes Decoder</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Once decrypted, the browser reads the leading bytes (magic bytes) to identify the file format:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] font-mono">
                  <div className="p-3 bg-background-secondary border border-white/5 rounded-lg text-text-secondary">
                    <span className="text-white block font-bold mb-1">PDFs: %PDF</span>
                    Starts with <code>0x25 0x50 0x44 0x46</code>. Automatically creates a secure object URL and opens it in a secure view tab.
                  </div>
                  <div className="p-3 bg-background-secondary border border-white/5 rounded-lg text-text-secondary">
                    <span className="text-white block font-bold mb-1">Images: PNG / JPEG</span>
                    Starts with <code>0x89 0x50 0x4E 0x47</code> (PNG) or <code>0xFF 0xD8 0xFF</code> (JPEG). Renders the image directly in the page UI.
                  </div>
                  <div className="p-3 bg-background-secondary border border-white/5 rounded-lg text-text-secondary">
                    <span className="text-white block font-bold mb-1">Text: Unicode</span>
                    Fallback format. Decodes bytes via <code>TextDecoder</code> and displays the contents inside a stylized code reader.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chapter 5: Dashboard */}
          {activeSection === "dashboard" && (
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
                  <LayoutDashboard className="text-accent-primary" size={24} />
                  Dashboard & Tatum Webhook Playground
                </h2>
                <div className="h-0.5 w-12 bg-accent-primary rounded-full"></div>
              </div>

              <p className="text-sm text-text-secondary leading-relaxed">
                The dashboard serves as the central control room where publishers monitor records, manage webhook alert integrations, and execute contract interactions.
              </p>

              {/* Dashboard sections */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white">Core Capabilities</h3>
                <ul className="space-y-3 text-xs text-text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-primary shrink-0 mt-1.5"></span>
                    <div>
                      <strong className="text-white">On-Chain Unlock Trigger:</strong> If a document has reached its time-lock expiration, the owner can execute <code>try_unlock</code> on the Move contract. This converts the publication state to unlocked, enabling verification access.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-primary shrink-0 mt-1.5"></span>
                    <div>
                      <strong className="text-white">Active Webhook Notifications:</strong> Lists current subscriptions registered on the Tatum API. The system monitors object mutation changes and calls endpoints automatically.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-primary shrink-0 mt-1.5"></span>
                    <div>
                      <strong className="text-white">Simulated Webhook Logger Playground:</strong> Integrates a simulation console directly on the dashboard page. It polls and displays incoming Webhook payloads (using Next.js server-side logging state) and allows manual simulated alerts so judges can inspect Tatum object state changes instantly.
                    </div>
                  </li>
                </ul>
              </div>

              {/* Webhook JSON Payload example */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <Terminal size={14} className="text-accent-secondary" />
                  Tatum Object Mutation Webhook Payload Example
                </h4>
                <div className="bg-background-primary border border-white/5 rounded-lg p-4 font-mono text-[11px] text-accent-primary overflow-x-auto">
                  <pre>{`{
  "type": "ADDRESS_TRANSACTION",
  "chain": "sui-testnet",
  "address": "0x12a456b3cd1278e90ab12c456df789a012bc34...", // Publication object ID
  "txId": "0x6f3fa8b12270979ea12b456cf789a012bc34e32098d022b7a9de8bf06412e...",
  "timestamp": 1717606050000,
  "blockNumber": 8291048,
  "status": "OBJECT_MUTATED",
  "detail": "Sui object was mutated (decrypted / unlocked) on-chain."
}`}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Chapter 6: Zero Knowledge guarantees */}
          {activeSection === "security" && (
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
                  <Lock className="text-accent-primary" size={24} />
                  Zero-Knowledge & Trust-Minimization Guarantees
                </h2>
                <div className="h-0.5 w-12 bg-accent-primary rounded-full"></div>
              </div>

              <p className="text-sm text-text-secondary leading-relaxed">
                DeadDrop enforces strict zero-knowledge guardrails at all protocol layers, ensuring the integrity of confidential uploads:
              </p>

              {/* Zero knowledge points */}
              <div className="space-y-4 text-xs font-sans text-text-secondary">
                <div className="flex gap-3 items-start p-4 bg-background-secondary border border-white/5 rounded-xl">
                  <div className="p-2 bg-accent-primary/10 rounded-lg text-accent-primary shrink-0">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="space-y-1">
                    <strong className="text-white block">Client-Side Key Generation</strong>
                    <p className="leading-relaxed">
                      Encryption keys are derived locally using cryptographically secure pseudorandom number generators (<code>crypto.getRandomValues</code>). The plain keys are never transmitted to any centralized server, logs, or databases.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-4 bg-background-secondary border border-white/5 rounded-xl">
                  <div className="p-2 bg-accent-secondary/10 rounded-lg text-accent-secondary shrink-0">
                    <Database size={18} />
                  </div>
                  <div className="space-y-1">
                    <strong className="text-white block">Decentralized Storage Fragments</strong>
                    <p className="leading-relaxed">
                      Only the encrypted binary ciphertext ever leaves the browser, heading directly to Walrus Protocol nodes. No unencrypted bytes ever sit in disk storage, making database compromises irrelevant.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-4 bg-background-secondary border border-white/5 rounded-xl">
                  <div className="p-2 bg-accent-primary/10 rounded-lg text-accent-primary shrink-0">
                    <Clock size={18} />
                  </div>
                  <div className="space-y-1">
                    <strong className="text-white block">Immutable Smart Contract Enforced Lock</strong>
                    <p className="leading-relaxed">
                      Embargo parameters are verified directly on-chain. Even if a third-party host compromises the frontend interface, early decryption is mathematically impossible because the consensus block time validates unlock state on the blockchain layer.
                    </p>
                  </div>
                </div>
              </div>

              {/* Conclusion card */}
              <div className="border border-accent-primary/10 bg-accent-primary/5 rounded-xl p-5 text-center space-y-4">
                <h3 className="text-sm font-semibold text-white">Ready to Secure Your First Document?</h3>
                <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
                  Start sharing confidential records with absolute cryptographic assurance today.
                </p>
                <div className="flex justify-center gap-3">
                  <Link href="/publish" className="btn-primary py-2 px-5 text-xs font-semibold">
                    Go to Publish
                    <ArrowRight size={12} />
                  </Link>
                  <Link href="/verify/locked-demo" className="btn-secondary py-2 px-5 text-xs font-semibold">
                    Test Demo Verify
                  </Link>
                </div>
              </div>
            </div>
          )}

        </section>
      </div>
    </div>
  );
}
