mod types;

use aztec::macros::aztec;

/// ZKCard: A ZK-powered payment card registry on Aztec.
///
/// Architecture overview:
///
///  1. Admin deploys the contract and registers authorized banks (public state).
///
///  2. A bank calls `issue_card` (private function):
///     - Creates a CardNote encrypted for `holder`
///     - The note commitment goes into the note-hash tree (private state)
///     - The encrypted note log is sent to `holder` via ONCHAIN_CONSTRAINED delivery
///     - From the outside, the note hash is public but its preimage is hidden
///
///  3. The cardholder calls `prove_card_ownership` (private function):
///     - The PXE selects one CardNote matching `required_bank_id`
///     - The circuit proves (in ZK) that the preimage of a committed note hash
///       satisfies bank_id == required_bank_id, WITHOUT revealing:
///         card_number_hash, expiry_year, expiry_month, credit_limit
///     - Returns `bank_id` as a public output (the only revealed field)
///
///  4. Anyone can view authorized banks (public state, fully transparent).
///
///  5. The holder can call `get_cards` (unconstrained utility, runs locally in PXE):
///     - Returns all their CardNotes from the PXE's local database
///     - No ZK proof is generated; purely for the UI to display card details
///
/// Key Aztec ZK concepts demonstrated:
///
///  - Private notes:    encrypted blobs committed to a global merkle tree.
///  - Ownership proof:  proving preimage knowledge without revealing fields.
///  - Nullifiers:       not used here (cards are not consumed); the note stays
///                      active. A `pop_notes` call would nullify (for spending).
///  - Public/private:   bank registry lives in public state (AVM),
///                      card data lives in private state (ACIR/PXE).
#[aztec]
pub contract ZKCard {
    use crate::types::card_note::CardNote;
    use aztec::{
        macros::{
            functions::{external, initializer, view},
            storage::storage,
        },
        messages::message_delivery::MessageDelivery,
        note::{
            constants::MAX_NOTES_PER_PAGE,
            note_getter_options::NoteGetterOptions,
            note_interface::NoteProperties,
            note_viewer_options::NoteViewerOptions,
        },
        protocol::{address::AztecAddress, traits::ToField},
        state_vars::{Map, Owned, PrivateSet, PublicMutable},
        utils::comparison::Comparator,
    };

    // Storage:
    //
    // `admin`            - the deployer; can authorize/revoke banks
    // `authorized_banks` - public map of bank address -> bool
    // `cards`            - per-holder private set of CardNotes
    //                      Owned wraps PrivateSet and provides .at(owner)

    #[storage]
    struct Storage<Context> {
        admin: PublicMutable<AztecAddress, Context>,
        authorized_banks: Map<AztecAddress, PublicMutable<bool, Context>, Context>,
        cards: Owned<PrivateSet<CardNote, Context>, Context>,
    }

    // -------------------------------------------------------------------------
    // Initializer
    // -------------------------------------------------------------------------

    /// Deploys the contract and sets the admin.
    /// Called exactly once (enforced by #[initializer] which inserts the
    /// deployment nullifier preventing re-initialization).
    #[external("public")]
    #[initializer]
    fn constructor(admin: AztecAddress) {
        assert(!admin.is_zero(), "admin cannot be the zero address");
        self.storage.admin.write(admin);
    }

    // -------------------------------------------------------------------------
    // Admin functions (public)
    // -------------------------------------------------------------------------

    /// Grants a bank the right to issue cards.
    /// Only the admin can call this; the result is visible on-chain.
    #[external("public")]
    fn authorize_bank(bank: AztecAddress) {
        assert(
            self.storage.admin.read().eq(self.msg_sender()),
            "caller is not the admin",
        );
        self.storage.authorized_banks.at(bank).write(true);
    }

    /// Revokes a bank's issuing rights.
    #[external("public")]
    fn revoke_bank(bank: AztecAddress) {
        assert(
            self.storage.admin.read().eq(self.msg_sender()),
            "caller is not the admin",
        );
        self.storage.authorized_banks.at(bank).write(false);
    }

    // -------------------------------------------------------------------------
    // Public view functions
    // -------------------------------------------------------------------------

    #[external("public")]
    #[view]
    fn get_admin() -> Field {
        self.storage.admin.read().to_field()
    }

    #[external("public")]
    #[view]
    fn is_bank_authorized(bank: AztecAddress) -> bool {
        self.storage.authorized_banks.at(bank).read()
    }

    // -------------------------------------------------------------------------
    // Private: card issuance
    // -------------------------------------------------------------------------

    /// Issues a card to `holder` as a private Aztec Note.
    ///
    /// Called by a bank. The bank's identity is captured as:
    ///   bank_id = msg_sender().to_field()
    ///
    /// The insert().deliver(ONCHAIN_CONSTRAINED) call:
    ///   1. Hashes the note (owner + storage_slot + randomness + fields)
    ///   2. Pushes the note hash to the private kernel
    ///   3. Encrypts the note and emits it as a log (so PXE can discover it)
    ///
    /// Authorization: anyone can call this and create a note with their own
    /// address as bank_id. Merchants validate bank_id against is_bank_authorized.
    #[external("private")]
    fn issue_card(
        holder: AztecAddress,
        card_number_hash: Field,
        expiry_year: u32,
        expiry_month: u32,
        credit_limit: u64,
    ) {
        let bank_id = self.msg_sender().to_field();

        let note = CardNote { card_number_hash, bank_id, expiry_year, expiry_month, credit_limit };

        // Insert into `holder`'s private set and deliver the encrypted note log.
        // ONCHAIN_CONSTRAINED means the log is committed in the same tx,
        // so the recipient's PXE can discover and decrypt it immediately.
        self.storage.cards.at(holder).insert(note).deliver(MessageDelivery.ONCHAIN_CONSTRAINED);
    }

    // -------------------------------------------------------------------------
    // Private: ownership proof
    // -------------------------------------------------------------------------

    /// Proves the caller owns a card issued by `required_bank_id`.
    ///
    /// ZK guarantees:
    ///   - The circuit proves knowledge of a CardNote preimage whose commitment
    ///     is in the note-hash tree (merkle membership proof).
    ///   - It constrains `note.bank_id == required_bank_id` inside the circuit.
    ///   - Only `bank_id` is returned as a public output.
    ///     card_number_hash, expiry, and credit_limit stay completely private.
    ///
    /// get_notes reads without nullifying (the card is NOT consumed).
    /// Use pop_notes to nullify (useful for one-time-use card scenarios).
    #[external("private")]
    fn prove_card_ownership(required_bank_id: Field) -> Field {
        // Build a filtered note query:
        // - field at packed index 1 (bank_id) must equal required_bank_id
        // - limit to 1 note (proving existence of at least one is enough)
        let options = NoteGetterOptions::new()
            .select(CardNote::properties().bank_id, Comparator.EQ, required_bank_id)
            .set_limit(1);

        // get_notes returns BoundedVec<ConfirmedNote<CardNote>, ...>
        // The note hash has been constrained to exist in the tree,
        // but the note is NOT nullified.
        let notes = self.storage.cards.at(self.msg_sender()).get_notes(options);

        assert(notes.len() > 0, "no card from that bank found in your wallet");

        // Return bank_id as the sole public output.
        // Everything else (card number, expiry, limit) stays private.
        notes.get_unchecked(0).note.bank_id
    }

    // -------------------------------------------------------------------------
    // Utility: local reads (unconstrained, runs in PXE)
    // -------------------------------------------------------------------------

    /// Returns a paginated list of the owner's CardNotes.
    ///
    /// Runs entirely in the PXE (no ZK proof generated).
    /// The #[external("utility")] annotation exposes this as an RPC call
    /// the frontend can invoke without submitting a transaction.
    ///
    /// Returns a fixed-size array (ABI requirement) plus a bool indicating
    /// whether more pages exist.
    #[external("utility")]
    unconstrained fn get_cards(
        owner: AztecAddress,
        page_index: u32,
    ) -> ([CardNote; MAX_NOTES_PER_PAGE], bool) {
        let offset = page_index * MAX_NOTES_PER_PAGE;
        let options = NoteViewerOptions::new().set_offset(offset);
        let notes = self.storage.cards.at(owner).view_notes(options);

        // Zero-initialise the output array; only slots 0..notes.len() are filled.
        let zero_note = CardNote {
            card_number_hash: 0,
            bank_id: 0,
            expiry_year: 0,
            expiry_month: 0,
            credit_limit: 0,
        };
        let mut cards = [zero_note; MAX_NOTES_PER_PAGE];
        for i in 0..MAX_NOTES_PER_PAGE {
            if i < notes.len() {
                cards[i] = notes.get_unchecked(i);
            }
        }

        (cards, notes.len() == MAX_NOTES_PER_PAGE)
    }
}
