# ZK-Card Consolidated Review

Date: 2026-04-18

## Verification Snapshot

The source reviews recorded the following checks:

| Command | Result |
| --- | --- |
| `aztec compile` in `packages/contracts` | succeeds |
| `aztec test` in `packages/contracts` | succeeds, but runs `0` test functions |
| `pnpm run build` in `packages/ui` | succeeds after the artifact-loader import was changed to `@aztec/aztec.js/abi` |
| `pnpm run lint` in `packages/ui` | fails |
| `pnpm compile` at repo root | false positive / no-op because the pnpm filter matches no package |

## High Severity

### H1. Root compile and test scripts are false positives

Files: `package.json:7-8`, `pnpm-workspace.yaml`, `packages/contracts/`

The root scripts are:

```json
"compile": "pnpm --filter contracts compile",
"test": "pnpm --filter contracts test"
```

There is no pnpm workspace package named `contracts`; `packages/contracts` has `Nargo.toml` but no `package.json`. `pnpm --filter contracts ...` can therefore exit green without compiling or testing the Noir contract.

Recommended fix: either add `packages/contracts/package.json` with `name: "contracts"` and scripts for `aztec compile` / `aztec test`, or change the root scripts to run those commands directly in `packages/contracts`.

### H2. `issue_card` does not enforce authorized banks

Files: `packages/contracts/src/main.nr:26-30`, `packages/contracts/src/main.nr:44-66`, `packages/contracts/src/main.nr:72-87`

The contract stores `admin` and `authorized_banks`, and exposes `authorize_bank`, `revoke_bank`, and `is_bank_authorized`, but `issue_card` never reads `authorized_banks`. Any caller can issue a private card note, and the contract records that caller's address as `bank_id`.

Recommended fix: check authorization before constructing and inserting the note:

```noir
assert(
    self.storage.authorized_banks.at(self.msg_sender()).read(),
    "caller is not an authorized bank",
);
```

Without this, the admin and authorization API is misleading and ineffective.

### H3. The API is an unauthenticated signing and privacy oracle

Files: `packages/ui/src/lib/aztec.ts:20-22`, `packages/ui/src/lib/aztec.ts:50-58`, `packages/ui/src/app/api/cards/route.ts:21-76`, `packages/ui/src/app/api/prove/route.ts:22-47`

The Next.js server owns both the bank and user sandbox accounts via one embedded wallet. The API exposes that wallet without user authentication or session binding:

- `POST /api/cards` signs `issue_card` as the server bank account for any request body.
- `GET /api/cards?owner=<address>` asks the server PXE to decrypt notes for the supplied owner.
- `POST /api/prove` always proves from the fixed server user account returned by `getUserAddress()`.

For a local sandbox demo this can be acceptable, but the code and UI read like a wallet-backed user app. In the current shape, the server is the wallet, not the browser user. This breaks the privacy model if deployed outside a local demo and makes proof generation prove possession by the server-configured user, not by the caller.

Recommended fix: clearly label this as a single-server sandbox demo, or move account ownership and session proof to the client/wallet flow before exposing issuance, card reads, or proof generation.

## Medium Severity

### M1. The proof flow overclaims on-chain verification

Files: `packages/ui/src/app/api/prove/route.ts:7-15`, `packages/ui/src/app/api/prove/route.ts:33-38`, `packages/ui/src/components/ProveOwnership.tsx:6-17`, `packages/ui/src/components/ProveOwnership.tsx:103-114`, `README.md:24-36`

The proof endpoint calls `.simulate({ from: accountAddr })`. That locally executes the private function in the PXE and returns the decoded result. It does not submit a transaction and does not verify anything on-chain.

The UI and README say the proof is sent to the sequencer and verified on-chain, including the success message `Proof verified on-chain!`.

Recommended fix: either change the implementation to submit a transaction, or change the copy to say the circuit is simulated/executed locally in the PXE and returns `bank_id` as a local public output.

### M2. `prove_card_ownership` returns only a value the caller already supplied

File: `packages/contracts/src/main.nr:93-107`

`prove_card_ownership(required_bank_id)` returns `notes.get_unchecked(0).note.bank_id`, but the selected note is constrained to match `required_bank_id`. The return value is therefore redundant. The meaningful statement is successful execution: "this sender has a note matching the requested bank."

Recommended fix: either remove the return value and treat success as the proof result, or return a purpose-specific public output such as a domain-separated claim or commitment if an external verifier needs a stable value.

### M3. Proofs are reusable because the note is not nullified

File: `packages/contracts/src/main.nr:93-107`

The contract comment correctly says `Card is NOT nullified`, and the code uses `get_notes`, not a consuming/nullifying read. That means the same card can prove ownership repeatedly.

Recommended fix: keep `get_notes` if reusable membership is intended, and make that explicit in product copy. If a proof should be single-use, add a nullifier or separate claim-spent state.

### M4. Expired cards can still prove ownership

File: `packages/contracts/src/main.nr:93-107`

`prove_card_ownership` filters only on `bank_id`. It does not check `expiry_year` or `expiry_month`. If the intended statement is "I own a currently valid card from this bank", the circuit needs a current date input or another validity mechanism. If the intended statement is only "I have ever received such a note", the UI copy should avoid implying card validity.

### M5. Card pagination is implemented in the contract but ignored by the API

Files: `packages/contracts/src/main.nr:113-138`, `packages/ui/src/app/api/cards/route.ts:34-41`, `packages/ui/src/hooks/useAztec.ts:168-177`

The contract returns `([CardNote; MAX_NOTES_PER_PAGE], bool)`, where the boolean indicates whether another page may exist. The API always calls `get_cards(owner, 0)` and discards the boolean. Users with more than one page of notes will silently see only the first page.

Recommended fix: loop while the contract returns `true`, or expose `page` through the API and make the UI request subsequent pages.

### M6. Hashing docs and implementation disagree

Files: `packages/contracts/src/types/card_note.nr:3-12`, `packages/ui/src/components/IssueCardForm.tsx:10-12`, `packages/ui/src/components/IssueCardForm.tsx:28-42`

The contract note comment says the card number hash is Poseidon2. The form comment says it is hashed locally with keccak. The actual implementation uses SHA-256 and reduces the digest modulo the BN254 field modulus.

Recommended fix: pick one scheme and document it consistently. If this value is meant to be circuit-native or later recomputed in Noir, Poseidon2 is the natural choice. If SHA-256 is kept for demo convenience, the contract and README should say SHA-256-to-field instead of Poseidon2 or keccak.

### M7. SHA-256 modulo field reduction is biased

File: `packages/ui/src/components/IssueCardForm.tsx:28-42`

The form computes `BigInt("0x" + hex) % BN254_FR_MODULUS`. This guarantees a valid Noir `Field`, but it does not produce a uniform field element. For this demo the risk is likely low, but the comment should acknowledge the reduction and bias if this remains part of the design.

### M8. Contract artifact is required by the UI but not produced by the root build

Files: `packages/ui/src/lib/contract.ts:13-14`, `package.json:7-10`, `.gitignore:9-10`

The UI requires `../../../contracts/target/zk_card-ZKCard.json`, but the root build only runs `pnpm --filter ui build`, and the root compile script currently does not compile the contract. Because `packages/contracts/target` is gitignored, a clean checkout can fail unless the developer manually runs `aztec compile` first.

Recommended fix: make the root build depend on contract compilation, or document and enforce a prebuild step.

### M9. Input validation is too thin on card issuance

File: `packages/ui/src/app/api/cards/route.ts:51-76`

`POST /api/cards` accepts `holderAddress`, `cardNumberHash`, `expiryYear`, `expiryMonth`, and `creditLimit` from the client and passes them into the private function after minimal parsing. Invalid months, nonsensical years, negative or oversized values, and malformed numeric strings are not rejected with clear 400 responses.

Recommended fix: validate all request fields before calling Aztec.js, including month range, year range, credit limit bounds, address parsing, and field modulus bounds.

### M10. Store modal can remain stuck on loading after connection failure

Files: `packages/ui/src/components/BuyModal.tsx:33-56`, `packages/ui/src/hooks/useAztec.ts:88-117`

`BuyModal` calls `aztec.connect()` in a `try/catch`, but `useAztec.connect()` catches failures internally, sets hook state to `error`, and does not rethrow. If the sandbox is offline or the contract is not deployed, `BuyModal` never receives an exception and never gets an address, so `step` remains `loading`.

Recommended fix: make `connect()` rethrow after setting state, or have `BuyModal` observe `aztec.status === "error"` / `aztec.error` and transition to its error state.

### M11. README still documents the old rc Aztec version

Files: `packages/contracts/Nargo.toml:6-7`, `packages/ui/package.json:11-16`, `README.md:51-55`

The contract dependency points to `aztec-nr` tag `v4.2.0`, and the UI Aztec packages are `4.2.0`. The README still says `v4.2.0-aztecnr-rc.2`.

Recommended fix: update the README to `v4.2.0` and add a short expected toolchain note so future dependency pins do not drift from the local CLI.

## Low Severity / Cleanup

### L1. No tests are currently exercised

Command: `aztec test` in `packages/contracts`

The command exits successfully but reports zero test functions. Given the authorization and proof semantics above, at least these tests are worth adding:

- Unauthorized caller cannot issue a card.
- Authorized bank can issue a card.
- Holder can prove ownership for the issuing bank.
- Holder cannot prove ownership for a different bank.
- Expired-card behavior matches the intended statement.
- Pagination returns subsequent card pages.

### L2. `get_cards` padding is detected through `bank_id == 0`

Files: `packages/contracts/src/main.nr:123-137`, `packages/ui/src/app/api/cards/route.ts:39-41`

The contract pads the fixed-size response with a zero note, and the API removes padding by filtering `bank_id !== 0`. A real `AztecAddress` should not derive to zero, so this is not a practical security issue, but it is an implicit sentinel contract between the Noir function and the TypeScript parser.

Recommended fix: return or preserve an explicit count/length if the Aztec return type allows it, or document the zero-note sentinel in both places.

### L3. Server wallet setup relies on hardcoded initial secrets

File: `packages/ui/src/lib/aztec.ts:20-22`, `packages/ui/src/lib/aztec.ts:50-58`

The app hardcodes initial sandbox secrets and creates accounts with `Fr.ZERO` salt. This is acceptable for a local demo, but it is version-sensitive and should not be presented as a general wallet pattern.

Recommended fix: prefer the upstream helper for initial sandbox accounts if available in this Aztec version, or document that the secrets are sandbox-only fixtures.

### L4. Label persistence is browser-local

Files: `packages/ui/src/components/IssueCardForm.tsx:76-79`, `packages/ui/src/hooks/useAztec.ts:173-176`

Bank-issued labels live in browser localStorage under `zk-card-labels`. Cross-browser or cross-device, labels disappear and cards render without the saved label. This is fine for a single-browser demo, but should be called out in the README if labels matter for demos.

### L5. `/api/status` swallows initialization errors as offline

File: `packages/ui/src/app/api/status/route.ts:7-12`

Any error from `getSandboxWallet()` is returned as `{ status: "offline" }`. This conflates "sandbox is down" with "wallet init threw for some other reason", such as a bad PXE URL or package mismatch.

Recommended fix: log the caught error server-side and, if appropriate, return a more specific status for non-connectivity failures.

### L6. Minor copy and cleanup items

- `packages/ui/src/lib/contract.ts:48`: `buttom` should be `button`.
- `packages/ui/src/lib/aztec.ts:77-80`: `getSandboxAccountAddress` is marked `@deprecated` but is still used by API routes. Either drop the tag or migrate callers to `getBankAddress()`.
- `packages/ui/src/components/IssueCardForm.tsx:52`: the default card number looks like a real PAN. Consider a clearly fake demo value.

### L7. `pnpm run lint` is broken in `packages/ui`

File: `packages/ui/package.json:9`

Running `pnpm run lint` fails with `Invalid project directory provided, no such directory: .../packages/ui/lint` — `next` is treating `lint` as a directory argument rather than a subcommand. The repo also has no ESLint config and no `eslint` / `eslint-config-next` dependency, so the script has no working path even if the invocation were fixed.

Recommended fix: either remove the `lint` script, or install `eslint` plus `eslint-config-next`, add a config, and replace the script with a direct `eslint` invocation.

## Suggested Fix Order

1. Fix H1 and M8 so root compile/test/build paths actually exercise the contract and produce the UI artifact.
2. Fix H2 and add the L1 Noir tests in the same change.
3. Fix M1 so the proof flow implementation and copy agree.
4. Decide the intended security model for H3 and document the sandbox-only model if the server-owned wallet remains.
5. Decide whether expiry and replay matter, then address M3 and M4 accordingly.
6. Align hash semantics across contract comments, UI comments, README, and implementation for M6/M7.
7. Add pagination and issuance validation for M5/M9.
8. Sweep README drift and low-severity cleanup items.
