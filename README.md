# ZK Card

A prototype that demonstrates private credit card ownership using Aztec's ZK infrastructure.

A bank issues a card as an encrypted private note on Aztec. The cardholder can later prove they own a card from that bank — without revealing the card number, expiry date, or credit limit. Only the bank's identity is disclosed.

## How it works

1. **Deploy** — admin deploys the contract and authorizes banks (public, visible on-chain)
2. **Issue** — bank calls `issue_card`, which stores a `CardNote` (card number hash, expiry, credit limit) as an encrypted note in the holder's PXE
3. **Prove** — holder calls `prove_card_ownership(bank_id)`, generating a ZK proof that they hold a valid card from that bank — returning only `bank_id`
4. **View** — holder can list their own cards locally via `get_cards` (no on-chain data exposed)

## Flows

### Card Issuance

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

### Ownership Proof

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

### Card Lookup

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

## Requirements

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/) v10+
- [Aztec CLI](https://docs.aztec.network/getting_started)

## Running locally

**1. Start the Aztec sandbox**

```bash
aztec start --local-network
```

Runs at `localhost:8081`.

**2. Install dependencies**

```bash
pnpm install
```

**3. Start the UI**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

**4. (Optional) Recompile the contract**

```bash
pnpm compile
```

Output goes to `packages/contracts/target/`.

## Usage

Two separate portals share the same backend and contract:

**Bank portal** (`/bank`):
1. Click **Connect** — registers both accounts in the local PXE
2. Click **Deploy new** — deploys the ZKCard contract
3. Fill in **Issue Card** and submit — generates a ZK proof and sends the encrypted note to the user's address

**Cardholder portal** (`/user`):
1. Click **Connect** — connects to the same PXE
2. Click **Attach existing** — enter the contract address from the bank portal
3. Click **Refresh** — lists your private card notes
4. Click **Generate ZK Proof** — proves ownership of a card without revealing card details
