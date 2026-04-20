/**
 * contract.ts — Server-side ZKCard contract interface (Node.js only).
 *
 * State is stored on `global` so Next.js hot reloads don't clear it.
 * Sandbox restarts wipe contract state — just redeploy from Bank Portal.
 */

import { Contract } from "@aztec/aztec.js/contracts";
import { AztecAddress } from "@aztec/aztec.js/addresses";
import { loadContractArtifact } from "@aztec/stdlib/abi";
import type { Wallet } from "@aztec/aztec.js/wallet";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ZKCardArtifact = loadContractArtifact(
  require("../../../contracts/target/zk_card-ZKCard.json"),
);

// Persist across hot reloads using global (standard Next.js dev pattern).
const g = global as typeof global & {
  _zkContract: Contract | undefined;
};

function getStored(): Contract | null {
  return g._zkContract ?? null;
}
function setStored(c: Contract | null) {
  g._zkContract = c ?? undefined;
}

/** Deploys a new ZKCard contract. */
export async function deployZKCard(
  wallet: Wallet,
  admin: AztecAddress,
): Promise<Contract> {
  const { contract } = await Contract.deploy(wallet, ZKCardArtifact, [
    admin,
  ]).send({ from: admin });
  setStored(contract);
  return contract;
}

/**
 * Attaches to an already-deployed ZKCard contract.
 * Registers the artifact with the PXE so private function simulations work.
 */
export async function attachZKCard(
  address: string,
  wallet: Wallet,
): Promise<Contract> {
  const addr = AztecAddress.fromString(address);
  const { instance } = await wallet.getContractMetadata(addr);
  if (!instance)
    throw new Error(
      `No contract found at ${address}. Did the sandbox restart?`,
    );
  await wallet.registerContract(instance, ZKCardArtifact);
  const c = Contract.at(addr, ZKCardArtifact, wallet);
  setStored(c);
  return c;
}

/** Returns the current contract or throws a clear error. */
export function getContract(): Contract {
  const c = getStored();
  if (!c)
    throw new Error(
      "Contract not set. Click on the bottom right buttom to deploy it.",
    );
  return c;
}

export function getContractAddress(): string | null {
  return getStored()?.address.toString() ?? null;
}

/** Called by aztec.ts when a sandbox restart is detected. */
export function clearContractCache(): void {
  setStored(null);
}

// ─── Shared type ─────────────────────────────────────────────────────────────

export interface CardNoteData {
  cardNumberHash: string;
  bankId: string;
  expiryYear: number;
  expiryMonth: number;
  creditLimit: number;
  /** Display label set by the bank at issuance — stored client-side in localStorage. */
  label?: string;
}
