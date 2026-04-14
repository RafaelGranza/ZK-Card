# ZK Card

A prototype that demonstrates private credit card ownership using Aztec's ZK infrastructure.

A bank issues a card as an encrypted private note on Aztec. The cardholder can later prove they own a card from that bank — without revealing the card number, expiry date, or credit limit. Only the bank's identity is disclosed.

## What this is (and isn't)

**Is this running on a real network?**

It runs entirely on a local Aztec sandbox (`aztec start --local-network`). The sandbox includes a real sequencer, a real local L1 (anvil), and a real PXE — the cryptography (Honk proofs) is genuine. It's not a devnet (public shared testnet) and it's not mocked. The difference from devnet is that everything runs on your machine.

**What exactly is being proved?**

When you call `prove_card_ownership`, the Noir circuit proves in zero-knowledge:

> *"I know a CardNote whose commitment exists in the note-hash tree, whose `bank_id` matches the required bank, and that belongs to my address."*

The only public output is `bank_id`. Card number, expiry, and credit limit stay private inside the circuit's witness — they never leave the PXE.

**Is the proof on-chain?**

Currently `prove_card_ownership` uses `.simulate()`, which runs the circuit locally in the PXE but does not submit the proof to the sequencer. This means the proof is only verified locally — it's not verifiable by anyone else on-chain. To make it truly on-chain verifiable, swap `.simulate()` for `.send()` in `/api/prove/route.ts`.

`issue_card` does use `.send()`, so the note commitment and encrypted note log are genuinely on-chain (in the note-hash tree and on L1).

**Why one contract? Can multiple banks and users share it?**

Yes — the contract is the entire platform, like a payment network:

```
ZKCard contract
  ├── authorized_banks (public state — visible to everyone)
  │     ├── bank_A → true
  │     └── bank_B → true
  └── cards (private state — scoped per holder)
        ├── user_1 → [CardNote(bank_A), CardNote(bank_B)]
        └── user_2 → [CardNote(bank_A)]
```

One contract handles multiple banks, multiple cardholders, and multiple cards per holder. The `authorize_bank` function creates a public registry, but `issue_card` itself does not enforce it on-chain — anyone can issue a note claiming to be a bank. The intended model is that merchants/verifiers call `is_bank_authorized(bank_id)` after the proof to validate the issuing bank.

## How it works

1. **Deploy** — admin deploys the contract and authorizes banks (public, visible on-chain)
2. **Issue** — bank calls `issue_card`, which stores a `CardNote` (card number hash, expiry, credit limit) as an encrypted note in the holder's PXE
3. **Prove** — holder calls `prove_card_ownership(bank_id)`, generating a ZK proof that they hold a valid card from that bank — returning only `bank_id`
4. **View** — holder can list their own cards locally via `get_cards` (no on-chain data exposed)

## Accounts

Two sandbox accounts are used:

| Role | Sandbox account | Usage |
|------|----------------|-------|
| Bank | `INITIAL_TEST_SECRET_KEYS[0]` | Deploys contract, issues cards |
| User | `INITIAL_TEST_SECRET_KEYS[1]` | Receives cards, proves ownership |

Both accounts are registered in the same PXE so note discovery works for either address.

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
