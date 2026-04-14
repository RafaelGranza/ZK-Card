/**
 * POST /api/prove — Generates a ZK proof of card ownership.
 *
 * Body: { bankId: string }
 * Returns: { provenBankId: string }
 *
 * Uses `.simulate({ from: address })` which:
 *   1. Queries the PXE for a CardNote matching bank_id
 *   2. Runs the ACIR circuit locally (generates ZK proof)
 *   3. Verifies the circuit constraints
 *   4. Returns the public output (bank_id) in SimulationResult.result
 *
 * To submit the proof on-chain (and have it verifiable by anyone), use .send()
 * instead of .simulate(). For this prototype, .simulate() demonstrates the
 * ZK proof generation without spending gas.
 */

import { NextResponse } from "next/server";
import { getContract } from "@/lib/contract";
import { getUserAddress } from "@/lib/aztec";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bankId: string = body.bankId;
    if (!bankId) {
      return NextResponse.json({ error: "missing bankId" }, { status: 400 });
    }

    const contract = getContract();
    const accountAddr = await getUserAddress();

    // Simulate the private prove_card_ownership function.
    // The circuit runs locally in the PXE with the private witness (CardNote).
    // The return value (bank_id) is the only public output.
    const simResult = await contract.methods
      .prove_card_ownership(BigInt(bankId))
      .simulate({ from: accountAddr });

    const provenBankId =
      "0x" + BigInt(simResult.result as bigint | string).toString(16).padStart(64, "0");

    return NextResponse.json({ provenBankId });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
