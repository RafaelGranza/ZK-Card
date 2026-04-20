use aztec::{macros::notes::note, protocol::traits::{Deserialize, Packable, Serialize}};

/// Private note representing a bank-issued payment card.
///
/// #[note] generates: NoteType, NoteHash (Poseidon2), NoteProperties (field selectors).
/// Packable field indices: 0=card_number_hash, 1=bank_id, 2=expiry_year, 3=expiry_month, 4=credit_limit
/// Owner and randomness are injected by the protocol at commitment time, not stored here.
#[derive(Deserialize, Eq, Packable, Serialize)]
#[note]
pub struct CardNote {
    /// SHA-256 hash of the card number reduced mod BN254 Fr (supplied by the JS client).
    /// Never stored in plaintext.
    pub card_number_hash: Field,
    /// Issuing bank's AztecAddress as a Field.
    pub bank_id: Field,
    pub expiry_year: u32,
    pub expiry_month: u32,
    /// Credit limit in smallest denomination (e.g. cents).
    pub credit_limit: u64,
}
