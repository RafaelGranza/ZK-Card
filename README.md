# ZK Card

A prototype that demonstrates private credit card ownership using Aztec's ZK infrastructure.

A bank issues a card as an encrypted private note on Aztec. The cardholder can later prove they own a card from that bank — without revealing the card number, expiry date, or credit limit. Only the bank's identity is disclosed.

## How it works

- **Issue**: bank calls `issue_card`, which stores a `CardNote` (card number hash, expiry, credit limit) encrypted in the holder's PXE
- **Prove**: holder calls `prove_card_ownership(bank_id)`, which generates a ZK proof that they hold a valid card from that bank — returning only the `bank_id`
- **View**: holder can list their own cards locally via `get_cards` (no on-chain data exposed)

## Stack

- **Contract**: Noir + aztec-nr `v4.2.0-aztecnr-rc.2`
- **UI**: Next.js 16 + Tailwind CSS
- **Network**: Aztec sandbox (local)

## Requirements

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/) v10+
- [Aztec CLI](https://docs.aztec.network/getting_started) — for running the sandbox and compiling contracts

## Running locally

**1. Start the Aztec sandbox**

```bash
aztec start --local-network
```

Runs at `localhost:8081` by default.

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

1. Click **Connect (sandbox)** — connects to the local Aztec node
2. Click **Deploy new** — deploys the ZKCard contract
3. Fill in **Issue Card** with a holder address and card details, then submit
4. Click **Refresh** to see the card appear under the holder's account
5. Enter the bank address in **Prove Card Ownership** to generate a ZK proof of ownership
