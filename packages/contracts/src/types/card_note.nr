use aztec::{macros::notes::note, protocol::traits::{Deserialize, Packable, Serialize}};

/// CardNote represents a bank-issued payment card stored as a private Aztec note.
///
/// Key ZK properties:
/// - The note is encrypted for the holder; only they can read it.
/// - The holder can prove they have this note without revealing any fields.
/// - `bank_id` is the issuing bank's address (as Field), can be public in a proof.
/// - `card_number_hash` never leaves the holder's device.
///
/// The `#[note]` macro auto-generates:
/// - NoteType:       a unique type ID for log routing
/// - NoteHash:       commits to note + owner + randomness via Poseidon2
/// - NoteProperties: typed PropertySelectors for each field
///
/// Owner address and randomness are NOT stored in the struct; the protocol
/// injects them at commitment time via the NoteHash trait.
///
/// Deriving Packable maps each field to one Field element (no manual packing):
///   index 0 -> card_number_hash
///   index 1 -> bank_id
///   index 2 -> expiry_year
///   index 3 -> expiry_month
///   index 4 -> credit_limit
///
/// These indices are what NoteGetterOptions::select() uses when filtering.
#[derive(Deserialize, Eq, Packable, Serialize)]
#[note]
pub struct CardNote {
    /// Poseidon2 hash of the real card number. Never stored in plaintext.
    pub card_number_hash: Field,
    /// The issuing bank's AztecAddress serialised as a Field.
    /// Acts as the authenticity anchor: only addresses in `authorized_banks`
    /// are considered official issuers.
    pub bank_id: Field,
    /// Expiration year (e.g. 2028)
    pub expiry_year: u32,
    /// Expiration month 1-12
    pub expiry_month: u32,
    /// Credit limit in the smallest denomination (e.g. cents)
    pub credit_limit: u64,
}
