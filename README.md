# ZK Card

A prototype for private credit card ownership on Aztec. A bank issues a card as an encrypted note; the holder can later prove they own a card from that bank, without revealing the card number, expiry, or limit.

![Demo](./docs/images/ZK-Card%20demo.gif)

## Architecture

**Issue** — bank calls `issue_card`; the card data is stored as an encrypted note in the holder's PXE, never exposed on-chain.

```mermaid
sequenceDiagram
    actor Bank
    participant Contract as ZKCard Contract
    participant Chain as Aztec Chain
    participant PXE as Holder's PXE

    Bank->>Contract: issue_card(holder, card_data)
    Contract->>Chain: push note_hash + emit encrypted log
    Chain-->>PXE: PXE discovers encrypted log
    PXE->>PXE: decrypt and store locally
```

**Prove** — holder calls `prove_card_ownership(bank_id)`; generates a ZK proof of note membership. Only the bank's identity is a public output.

```mermaid
sequenceDiagram
    actor Holder
    participant PXE as Holder's PXE
    participant Chain as Aztec Chain

    Holder->>PXE: prove_card_ownership(bank_id)
    PXE->>PXE: fetch CardNote + generate ZK proof
    PXE->>Chain: submit proof tx
    Note over Chain: only bank_id is public output
```

**View** — holder calls `get_cards`; reads directly from the local PXE, no transaction needed.

```mermaid
sequenceDiagram
    actor Holder
    participant PXE as Holder's PXE

    Holder->>PXE: get_cards(owner)
    PXE->>PXE: read local CardNotes
    PXE->>Holder: return card list
    Note over Holder,PXE: no on-chain transaction
```

## Stack

- **Contract**: Noir + aztec-nr `v4.2.0-aztecnr-rc.2`
- **UI**: Next.js 16 + Tailwind CSS
- **Network**: Aztec sandbox (local)

## Running locally

```bash
aztec start --local-network   # start sandbox at localhost:8081
pnpm install
pnpm dev                      # open http://localhost:3000
```

## Usage

1. **Deploy** — click the badge in the bottom-right corner to deploy the contract.
2. **Issue a card** (`/bank`) — connect and fill in the Issue Card form.
3. **View & prove** (`/user`) — connect; cards load automatically. Use Generate ZK Proof to prove card ownership without revealing any card details.
4. **Buy** (`/store`) — claim the book with a ZK ownership proof.
