/**
 * aztec.ts — Server-side Aztec.js client (Node.js only).
 *
 * Two sandbox accounts are registered in the same PXE:
 *   - Bank  (INITIAL_TEST_SECRET_KEYS[0]): deploys contract, issues cards
 *   - User  (INITIAL_TEST_SECRET_KEYS[1]): receives cards, proves ownership
 *
 * Both must be registered so the PXE can find and decrypt notes for either
 * address. Note tags are computed via DHKE using the recipient's IVSK — if
 * the recipient's account isn't registered, the PXE can't compute the tag
 * and the note stays invisible.
 */

import { Fr } from "@aztec/aztec.js/fields";
import { EmbeddedWallet } from "@aztec/wallets/embedded";
import type { AztecAddress } from "@aztec/aztec.js/addresses";
import type { Wallet } from "@aztec/aztec.js/wallet";
export const SANDBOX_URL = process.env.PXE_URL ?? "http://localhost:8080";

// INITIAL_TEST_SECRET_KEYS from @aztec/accounts — matches the sandbox pre-deployed accounts.
const BANK_SECRET = Fr.fromString(
  "0x2153536ff6628eee01cf4024889ff977a18d9fa61d0e414422f7681cf085c281",
);
const USER_SECRET = Fr.fromString(
  "0xaebd1b4be76efa44f5ee655c20bf9ea60f7ae44b9a7fd1fd9f189c7a0b0cdae",
);

// Persist across Next.js hot reloads using global (standard dev pattern).
const g = global as typeof global & {
  _zkWallet: EmbeddedWallet | undefined;
  _zkBankAddress: AztecAddress | undefined;
  _zkUserAddress: AztecAddress | undefined;
};

function getWallet() {
  return g._zkWallet ?? null;
}
function getBank() {
  return g._zkBankAddress ?? null;
}
function getUser() {
  return g._zkUserAddress ?? null;
}

function setWallet(w: EmbeddedWallet, bank: AztecAddress, user: AztecAddress) {
  g._zkWallet = w;
  g._zkBankAddress = bank;
  g._zkUserAddress = user;
}

/**
 * Returns a singleton EmbeddedWallet with BOTH accounts registered.
 * Must be initialized before any contract interaction.
 *
 * The wallet cache survives Next.js hot reloads (via global).
 * Sandbox restarts are detected in /api/status by verifying the contract
 * still exists — that route calls clearWalletCache() + clearContractCache()
 * so the next request here creates a fresh EmbeddedWallet/PXE.
 */
export async function getSandboxWallet(): Promise<EmbeddedWallet> {
  if (getWallet()) return getWallet()!;

  const wallet = await EmbeddedWallet.create(SANDBOX_URL, { ephemeral: true });
  const bank = (await wallet.createSchnorrAccount(BANK_SECRET, Fr.ZERO))
    .address;
  const user = (await wallet.createSchnorrAccount(USER_SECRET, Fr.ZERO))
    .address;
  setWallet(wallet, bank, user);
  return wallet;
}

/** Called by /api/status when a sandbox restart is detected. */
export function clearWalletCache(): void {
  g._zkWallet = undefined;
  g._zkBankAddress = undefined;
  g._zkUserAddress = undefined;
}

export async function getBankAddress(): Promise<AztecAddress> {
  await getSandboxWallet();
  return getBank()!;
}

export async function getUserAddress(): Promise<AztecAddress> {
  await getSandboxWallet();
  return getUser()!;
}

/** @deprecated use getBankAddress() */
export async function getSandboxAccountAddress(): Promise<AztecAddress> {
  return getBankAddress();
}

export type { Wallet };
export { Fr };
