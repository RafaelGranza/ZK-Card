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

export const SANDBOX_URL = process.env.PXE_URL ?? "http://localhost:8081";

// INITIAL_TEST_SECRET_KEYS from @aztec/accounts — matches the sandbox pre-deployed accounts.
const BANK_SECRET = Fr.fromString("0x2153536ff6628eee01cf4024889ff977a18d9fa61d0e414422f7681cf085c281");
const USER_SECRET = Fr.fromString("0xaebd1b4be76efa44f5ee655c20bf9ea60f7ae44b9a7fd1fd9f189c7a0b0cdae");

let walletInstance: EmbeddedWallet | null = null;
let bankAddressInstance: AztecAddress | null = null;
let userAddressInstance: AztecAddress | null = null;

/**
 * Returns a singleton EmbeddedWallet with BOTH accounts registered.
 * Must be initialized before any contract interaction.
 */
export async function getSandboxWallet(): Promise<EmbeddedWallet> {
  if (!walletInstance) {
    const wallet = await EmbeddedWallet.create(SANDBOX_URL, { ephemeral: true });

    // Register bank account (sandbox account[0])
    const bankManager = await wallet.createSchnorrAccount(BANK_SECRET, Fr.ZERO);
    bankAddressInstance = bankManager.address;

    // Register user account (sandbox account[1])
    // This is required so the PXE can decrypt notes issued to the user.
    const userManager = await wallet.createSchnorrAccount(USER_SECRET, Fr.ZERO);
    userAddressInstance = userManager.address;

    walletInstance = wallet;
  }
  return walletInstance;
}

export async function getBankAddress(): Promise<AztecAddress> {
  if (!bankAddressInstance) await getSandboxWallet();
  return bankAddressInstance!;
}

export async function getUserAddress(): Promise<AztecAddress> {
  if (!userAddressInstance) await getSandboxWallet();
  return userAddressInstance!;
}

/** @deprecated use getBankAddress() */
export async function getSandboxAccountAddress(): Promise<AztecAddress> {
  return getBankAddress();
}

export type { Wallet };
export { Fr };
