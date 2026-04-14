/**
 * aztec.ts — Server-side Aztec.js client (Node.js only).
 *
 * Architecture (Aztec 4.2):
 *   - The sandbox exposes ONLY the AztecNode over HTTP (namespaced as `node_*`).
 *   - PXE must run IN-PROCESS. We use NodeEmbeddedWallet (re-exported as
 *     EmbeddedWallet from @aztec/wallets/embedded), which creates a local
 *     ephemeral PXE connected to the remote node.
 *   - After creation we register INITIAL_TEST_SECRET_KEYS[0] as a Schnorr account
 *     so the PXE can decrypt notes and create proofs for that address.
 *   - EmbeddedWallet.createSchnorrAccount(secret, salt) registers the account and
 *     returns an AccountManager whose .address matches the sandbox pre-deployed
 *     account[0] (because it uses the same derivation: deriveSigningKey(secret)
 *     which equals deriveMasterIncomingViewingSecretKey(secret)).
 */

import { Fr } from "@aztec/aztec.js/fields";
import { EmbeddedWallet } from "@aztec/wallets/embedded";
import type { AztecAddress } from "@aztec/aztec.js/addresses";
import type { Wallet } from "@aztec/aztec.js/wallet";

export const SANDBOX_URL = process.env.PXE_URL ?? "http://localhost:8081";

// INITIAL_TEST_SECRET_KEYS[0] — matches the sandbox's pre-deployed Schnorr account 0.
const SECRET_HEX = "0x2153536ff6628eee01cf4024889ff977a18d9fa61d0e414422f7681cf085c281";
const PROTOTYPE_SECRET = Fr.fromString(SECRET_HEX);

let walletInstance: EmbeddedWallet | null = null;
let accountAddressInstance: AztecAddress | null = null;

/**
 * Returns a singleton EmbeddedWallet (full Wallet + in-process PXE).
 * On first call, creates the wallet, creates an ephemeral PXE connected
 * to the sandbox, and registers the prototype Schnorr account.
 */
export async function getSandboxWallet(): Promise<Wallet> {
  if (!walletInstance) {
    // NodeEmbeddedWallet.create() starts a local PXE connected to the remote node.
    // ephemeral: true → in-memory temp LMDB store (no disk writes).
    const wallet = await EmbeddedWallet.create(SANDBOX_URL, { ephemeral: true });

    // Register the sandbox's test account[0]. createSchnorrAccount derives the
    // signing key as deriveMasterIncomingViewingSecretKey(secret) = deriveSigningKey(secret),
    // which is what the sandbox used when pre-deploying this account.
    const manager = await wallet.createSchnorrAccount(PROTOTYPE_SECRET, Fr.ZERO);
    accountAddressInstance = manager.address;

    walletInstance = wallet;
  }
  return walletInstance;
}

/**
 * Returns the AztecAddress of the prototype Schnorr account
 * (INITIAL_TEST_SECRET_KEYS[0] + salt Fr.ZERO).
 */
export async function getSandboxAccountAddress(): Promise<AztecAddress> {
  if (!accountAddressInstance) {
    await getSandboxWallet(); // populates accountAddressInstance as a side-effect
  }
  return accountAddressInstance!;
}

export type { Wallet };
export { Fr };
