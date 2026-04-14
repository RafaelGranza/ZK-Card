/**
 * contract.ts — Server-side ZKCard contract interface (Node.js only).
 *
 * deployZKCard() and attachZKCard() take a Wallet (the sandbox node cast as
 * Wallet) which has both PXE and signing capabilities in sandbox mode.
 */

import { Contract } from "@aztec/aztec.js/contracts";
import { AztecAddress } from "@aztec/aztec.js/addresses";
import { loadContractArtifact } from "@aztec/stdlib/abi";
import type { Wallet } from "@aztec/aztec.js/wallet";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ZKCardArtifact = loadContractArtifact(require("../../../contracts/target/zk_card-ZKCard.json"));

let contractInstance: Contract | null = null;
let contractAddressStr: string | null = null;

/** Deploys a new ZKCard contract. Returns the deployed contract. */
export async function deployZKCard(wallet: Wallet, admin: AztecAddress): Promise<Contract> {
  // Contract.deploy(wallet, artifact, [constructorArgs]) builds a DeployMethod.
  // .send({ from: admin }) submits the deployment tx and waits for mining.
  const { contract } = await Contract.deploy(wallet, ZKCardArtifact, [admin]).send({ from: admin });
  contractInstance = contract;
  contractAddressStr = contract.address.toString();
  return contract;
}

/** Attaches to an already-deployed ZKCard contract. */
export function attachZKCard(address: string, wallet: Wallet): Contract {
  const addr = AztecAddress.fromString(address);
  const c = Contract.at(addr, ZKCardArtifact, wallet);
  contractInstance = c;
  contractAddressStr = address;
  return c;
}

/** Returns the current contract (throws if not set). */
export function getContract(): Contract {
  if (!contractInstance) {
    throw new Error("Contract not deployed. Call /api/deploy first.");
  }
  return contractInstance;
}

export function getContractAddress(): string | null {
  return contractAddressStr;
}

// ─── Shared type ─────────────────────────────────────────────────────────────

export interface CardNoteData {
  cardNumberHash: string;
  bankId: string;
  expiryYear: number;
  expiryMonth: number;
  creditLimit: number; // in dollars
}
