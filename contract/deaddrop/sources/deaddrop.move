// REDEPLOYMENT REQUIRED after this fix
// Run: sui client publish --gas-budget 150000000
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
    // It is a Sui struct with the `key` ability (meaning it's an object that has a unique ID and can be stored in global storage)
    // and the `store` ability (meaning it can be nested inside other objects or transferred freely).
    public struct Publication has key, store {
        // Unique global identifier for this object instance on the Sui blockchain
        id: UID,
        // The Walrus blob ID string, which points to the encrypted document blob stored on the Walrus network
        blob_id: String,
        // SHA-256 hash of the original unencrypted file (useful to prove integrity without revealing the content)
        sha256_hash: String,
        // Public title of the document
        title: String,
        // The address of the publisher who created the document
        owner: address,
        // The timestamp (in milliseconds) when the document was published, retrieved from Sui's Clock
        created_at: u64,
        // The timestamp (in milliseconds) when the document unlocks. If set to 0, it is immediately unlocked
        unlock_at: u64,
        // A boolean flag representing whether the document is currently locked
        locked: bool,
        // Public category string, e.g., "Investigative Report", "Evidence", "Contract"
        category: String,
    }

    // --- create a new publication ---
    // An entry function that can be called directly by transactions.
    // It accepts raw byte vectors for strings (since CLI/SDKs send bytes) and converts them to UTF-8 strings.
    // it registers the publication and transfers ownership of the resulting object to the sender's address.
    public entry fun create_publication(
        blob_id: vector<u8>,
        sha256_hash: vector<u8>,
        title: vector<u8>,
        category: vector<u8>,
        unlock_at: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Get the current trustless network timestamp in milliseconds
        let now = clock::timestamp_ms(clock);
        
        // The document is locked if the specified unlock time is strictly in the future compared to now
        let is_locked = unlock_at > now;
        
        // Instantiate the Publication struct
        let publication = Publication {
            // Generate a brand new globally unique object ID
            id: object::new(ctx),
            // Convert the raw byte array parameters into standard Move UTF-8 strings
            blob_id: string::utf8(blob_id),
            sha256_hash: string::utf8(sha256_hash),
            title: string::utf8(title),
            // Set owner to the caller of this transaction
            owner: tx_context::sender(ctx),
            created_at: now,
            unlock_at,
            locked: is_locked,
            category: string::utf8(category),
        };

        // Transfer the newly created publication object directly to the publisher's wallet.
        // This gives them exclusive authority to manage or transfer the object, though anyone can view it on-chain.
        transfer::transfer(
            publication, 
            tx_context::sender(ctx)
        );
    }

    // --- try to unlock a publication ---
    // Anyone can call this function to process the unlock state of a publication.
    // It checks if the current time has passed the target unlock time. If so, it flips the `locked` status to false.
    // If the time hasn't passed, it aborts the transaction, reverting any changes.
    public entry fun try_unlock(
        publication: &mut Publication,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        // First, assert that the publication is currently locked.
        // If `publication.locked` is false (meaning it is already unlocked), the assertion fails
        // and aborts with EAlreadyUnlocked. If it is true, the execution continues.
        assert!(publication.locked, EAlreadyUnlocked);
        
        // Get the current trustless network timestamp in milliseconds
        let now = clock::timestamp_ms(clock);
        
        // Assert that the current time is greater than or equal to the target unlock time.
        // If it is still too early, the assertion fails and aborts with EStillLocked.
        assert!(
            now >= publication.unlock_at, 
            EStillLocked
        );
        
        // Flip the locked flag to false, making the document officially public / unlocked on-chain
        publication.locked = false;
    }

    // --- read-only getter functions ---
    // These allow external contracts or client SDKs to query fields of a Publication object.

    // Returns a reference to the Walrus blob ID string
    public fun get_blob_id(p: &Publication): &String {
        &p.blob_id
    }

    // Returns a reference to the document's public title
    public fun get_title(p: &Publication): &String {
        &p.title
    }

    // Returns the address of the publisher
    public fun get_owner(p: &Publication): address {
        p.owner
    }

    // Returns true if the document is currently time-locked
    public fun is_locked(p: &Publication): bool {
        p.locked
    }

    // Returns the unlock timestamp in milliseconds
    public fun get_unlock_at(p: &Publication): u64 {
        p.unlock_at
    }

    // Returns the creation timestamp in milliseconds
    public fun get_created_at(p: &Publication): u64 {
        p.created_at
    }

    // Returns a reference to the SHA-256 hash of the original document
    public fun get_sha256_hash(p: &Publication): &String {
        &p.sha256_hash
    }

    // Returns a reference to the document's category
    public fun get_category(p: &Publication): &String {
        &p.category
    }
}
