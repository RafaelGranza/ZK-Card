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

**Prove** — holder calls `prove_card_ownership(bank_id, current_year, current_month)`; the circuit runs locally in the PXE. It checks note membership and that the card has not expired. No transaction is submitted — success is the proof.

```mermaid
sequenceDiagram
    actor Holder
    participant PXE as Holder's PXE

    Holder->>PXE: prove_card_ownership(bank_id, year, month)
    PXE->>PXE: fetch CardNote + run ACIR circuit locally
    PXE->>PXE: verify: note membership + card not expired
    Note over PXE: no tx submitted — proof stays local
    Note over PXE: card number, expiry, limit stay private
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

- **Contract**: Noir + aztec-nr `v4.2.0` — core of the prototype
- **UI**: Next.js 16 + Tailwind CSS — demo interface only
- **Network**: Aztec sandbox (local)

> **Toolchain**: contract uses aztec-nr `v4.2.0` (Nargo.toml); UI packages use `@aztec/* 4.2.0`. Run `aztec --version` to confirm your local CLI matches before compiling.

## Running locally

```bash
aztec start --local-network   # start sandbox at localhost:8080
pnpm install
pnpm dev                      # open http://localhost:3000
```

## Usage

1. **Deploy** — click the badge in the bottom-right corner to deploy the contract.
2. **Issue a card** (`/bank`) — connect and fill in the Issue Card form.
3. **View & prove** (`/user`) — connect; cards load automatically. Use Generate ZK Proof to prove card ownership without revealing any card details.
4. **Buy** (`/store`) — claim access to the whitepaper with a ZK ownership proof.