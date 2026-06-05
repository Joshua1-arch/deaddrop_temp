// REDEPLOYMENT REQUIRED
// Run: ..\..\sui.exe client publish --gas-budget 150000000
// Update NEXT_PUBLIC_PACKAGE_ID in .env.local

// Module definition declaring the package address "deaddrop" and module name "publication"
module deaddrop::publication {
    // --- imports ---
    // Import the object module for managing Sui unique identifiers (UID)
    use sui::object::{Self, UID};
    // Import the tx_context module to manage transaction sender and gas information
    use sui::tx_context::{Self, TxContext};
    // Import the transfer module to move ownership of objects to users or share them
    use sui::transfer;
    // Import the clock module to access Sui's global shared Clock object for timestamping
    use sui::clock::{Self, Clock};
    // Import the string module to allow UTF-8 text strings to be stored on-chain
    use std::string::{Self, String};

    // --- error codes ---
    // Error thrown when the signer is not authorized (not the owner)
    const ENotOwner: u64 = 1;
    // Error thrown when someone tries to unlock a publication that has already been unlocked
    const EAlreadyUnlocked: u64 = 2;
    // Error thrown when someone tries to unlock a publication before its unlock timestamp has arrived
    const EStillLocked: u64 = 3;

    // --- the Publication object ---
    // This is the core on-chain record for every document published on DeadDrop.
    public struct Publication has key, store {
        // Unique global identifier for this object instance on the Sui blockchain
        id: UID,
        // The Walrus blob ID string, which points to the encrypted document blob stored on the Walrus network
        blob_id: String,
        // SHA-256 hash of the original unencrypted file
        sha256_hash: String,
        // Public title of the document
        title: String,
        // The address of the publisher who created the document
        owner: address,
        // The timestamp (in milliseconds) when the document was published
        created_at: u64,
        // The timestamp (in milliseconds) when the document unlocks
        unlock_at: u64,
        // A boolean flag representing whether the document is currently locked
        locked: bool,
        // Public category string, e.g., "Investigative Report", "Evidence", "Contract"
        category: String,
        // Encrypted AES key wrapped with recipient's public key. Empty if no specific recipient
        wrapped_key: vector<u8>,
        // Recipient's Sui address. Zero address means document is public after unlock
        recipient: address,
    }

    // --- create a new publication ---
    public entry fun create_publication(
        blob_id: vector<u8>,
        sha256_hash: vector<u8>,
        title: vector<u8>,
        category: vector<u8>,
        unlock_at: u64,
        wrapped_key: vector<u8>,
        recipient: address,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Get the current trustless network timestamp in milliseconds
        let now = clock::timestamp_ms(clock);
        
        // The document is locked if the specified unlock time is strictly in the future compared to now
        let is_locked = unlock_at > now;
        
        // Instantiate the Publication struct
        let publication = Publication {
            id: object::new(ctx),
            blob_id: string::utf8(blob_id),
            sha256_hash: string::utf8(sha256_hash),
            title: string::utf8(title),
            owner: tx_context::sender(ctx),
            created_at: now,
            unlock_at,
            locked: is_locked,
            category: string::utf8(category),
            wrapped_key,
            recipient,
        };

        // Transfer the newly created publication object directly to the publisher's wallet.
        transfer::transfer(
            publication, 
            tx_context::sender(ctx)
        );
    }

    // --- try to unlock a publication ---
    public entry fun try_unlock(
        publication: &mut Publication,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        assert!(publication.locked, EAlreadyUnlocked);
        let now = clock::timestamp_ms(clock);
        assert!(
            now >= publication.unlock_at, 
            EStillLocked
        );
        publication.locked = false;
    }

    // --- read-only getter functions ---

    public fun get_blob_id(p: &Publication): &String {
        &p.blob_id
    }

    public fun get_title(p: &Publication): &String {
        &p.title
    }

    public fun get_owner(p: &Publication): address {
        p.owner
    }

    public fun is_locked(p: &Publication): bool {
        p.locked
    }

    public fun get_unlock_at(p: &Publication): u64 {
        p.unlock_at
    }

    public fun get_created_at(p: &Publication): u64 {
        p.created_at
    }

    public fun get_sha256_hash(p: &Publication): &String {
        &p.sha256_hash
    }

    public fun get_category(p: &Publication): &String {
        &p.category
    }

    public fun get_wrapped_key(p: &Publication): &vector<u8> {
        &p.wrapped_key
    }

    public fun get_recipient(p: &Publication): address {
        p.recipient
    }
}
