# DeadDrop Smart Contract Deployment Guide

Follow these steps to build, test, and deploy the DeadDrop Move smart contract to the Sui Testnet.

## Prerequisites

1. **Install Rust and Cargo**: (If not already installed)
   Follow instructions at [rustup.rs](https://rustup.rs/).

2. **Install Sui CLI**:
   Run the following command to compile and install the Sui client binary for Testnet compatibility:
   ```bash
   cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui
   ```
   *Alternative*: Download pre-built binaries directly from [Sui Releases](https://github.com/MystenLabs/sui/releases).

---

## Deployment Steps

### 1. Initialize and Fund Your Sui Wallet

If you don't have a local Sui client config or wallet, create one:
```bash
# Generate a new local active address using ed25519 scheme
sui client new-address ed25519
```

Next, request testnet SUI tokens for gas using the faucet:
```bash
# Request SUI from testnet faucet to your active address
sui client faucet
```
*(Alternatively, join the Sui Discord server and paste your address in the `#testnet-faucet` channel)*

### 2. Switch to Sui Testnet Environment

Ensure your CLI is pointed to the testnet RPC endpoint:
```bash
# Switch environment to testnet
sui client switch --env testnet
```
Verify your network environment and balance:
```bash
sui client active-address
sui client gas
```

### 3. Build the Contract

Navigate to the contract directory and compile the package to ensure there are no compilation errors:
```bash
cd contract/deaddrop
sui move build
```

### 4. Deploy the Smart Contract

Publish the package on-chain:
```bash
sui client publish --gas-budget 100000000
```
This transaction will compile the Move code, upload the bytecode, and initialize the package.

### 5. Configure the Frontend Package ID

1. Examine the JSON output of the publication transaction.
2. Search for the `"ObjectChanges"` array.
3. Locate the item with `"type": "published"` and extract the `"packageId"` string (which looks like `0x...`).
4. Open the frontend configuration file: `lib/constants.ts` (or `lib/sui.ts`).
5. Update the `DEADDROP_PACKAGE_ID` or fallback package ID constant with the newly copied package ID.
