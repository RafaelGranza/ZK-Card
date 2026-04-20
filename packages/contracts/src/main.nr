mod types;
mod tests;

use aztec::macros::aztec;

/// ZKCard: private credit card registry on Aztec.
///
/// - Banks call `issue_card` (private) -> creates a CardNote encrypted for the holder.
/// - Holders call `prove_card_ownership` (private) -> ZK proof of card ownership; success is the proof.
/// - Admin manages authorized banks in public state.
/// - `get_cards` (utility) -> local PXE read for the UI, no proof generated.

/// Returns true if the card's expiry is on or after the given current date.
/// Extracted as a free function so it can be unit-tested without contract context.
pub fn is_card_valid(expiry_year: u32, expiry_month: u32, current_year: u32, current_month: u32) -> bool {
    (expiry_year > current_year) | ((expiry_year == current_year) & (expiry_month >= current_month))
}

#[aztec]
pub contract ZKCard {
    use crate::types::card_note::CardNote;
    use crate::is_card_valid;
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

    #[storage]
    struct Storage<Context> {
        admin: PublicMutable<AztecAddress, Context>,
        authorized_banks: Map<AztecAddress, PublicMutable<bool, Context>, Context>,
        cards: Owned<PrivateSet<CardNote, Context>, Context>,
    }

    #[external("public")]
    #[initializer]
    fn constructor(admin: AztecAddress) {
        assert(!admin.is_zero(), "admin cannot be the zero address");
        self.storage.admin.write(admin);
    }

    // -------------------------------------------------------------------------
    // Admin
    // -------------------------------------------------------------------------

    #[external("public")]
    fn authorize_bank(bank: AztecAddress) {
        assert(
            self.storage.admin.read().eq(self.msg_sender()),
            "caller is not the admin",
        );
        self.storage.authorized_banks.at(bank).write(true);
    }

    #[external("public")]
    fn revoke_bank(bank: AztecAddress) {
        assert(
            self.storage.admin.read().eq(self.msg_sender()),
            "caller is not the admin",
        );
        self.storage.authorized_banks.at(bank).write(false);
    }

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
    // Card issuance (private)
    // -------------------------------------------------------------------------

    /// Creates a CardNote encrypted for `holder` and commits its hash to the note tree.
    /// bank_id is captured implicitly from msg_sender - not passed as argument.
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

        self.storage.cards.at(holder).insert(note).deliver(MessageDelivery.ONCHAIN_CONSTRAINED);
    }

    // -------------------------------------------------------------------------
    // Ownership proof (ZK)
    // -------------------------------------------------------------------------

    /// ZK proof that the caller owns a non-expired card from `required_bank_id`.
    /// Proves Merkle membership of the note hash without revealing any other fields.
    /// Success is the proof - no public output. Card is NOT nullified (proofs are reusable).
    /// `current_year` and `current_month` are caller-supplied and constrained in-circuit.
    #[external("private")]
    fn prove_card_ownership(required_bank_id: Field, current_year: u32, current_month: u32) {
        let options = NoteGetterOptions::new()
            .select(CardNote::properties().bank_id, Comparator.EQ, required_bank_id)
            .set_limit(1);

        let notes = self.storage.cards.at(self.msg_sender()).get_notes(options);

        assert(notes.len() > 0, "no card from that bank found in your wallet");

        let note = notes.get_unchecked(0).note;
        assert(
            is_card_valid(note.expiry_year, note.expiry_month, current_year, current_month),
            "card is expired",
        );
    }

    // -------------------------------------------------------------------------
    // Utility (unconstrained, runs in PXE)
    // -------------------------------------------------------------------------

    /// Returns paginated CardNotes from the owner's local PXE database. No proof generated.
    #[external("utility")]
    unconstrained fn get_cards(
        owner: AztecAddress,
        page_index: u32,
    ) -> ([CardNote; MAX_NOTES_PER_PAGE], bool) {
        let offset = page_index * MAX_NOTES_PER_PAGE;
        let options = NoteViewerOptions::new().set_offset(offset);
        let notes = self.storage.cards.at(owner).view_notes(options);

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
