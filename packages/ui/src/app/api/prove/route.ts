/**
 * POST /api/prove — Runs the ZK ownership circuit locally in the PXE.
 *
 * Body: { bankId: string }
 * Returns: { verified: true }
 *
 * Uses `.simulate({ from: address })` which:
 *   1. Queries the PXE for a CardNote matching bank_id
 *   2. Runs the ACIR circuit locally — no transaction submitted
 *   3. Verifies circuit constraints (note membership + card not expired)
 *
 * Success means the constraints held. The function has no public return value —
 * the only information revealed is what the caller already supplied (bank_id).
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

    // Pass the current calendar date so the circuit can check card expiry.
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    await contract.methods
      .prove_card_ownership(BigInt(bankId), currentYear, currentMonth)
      .simulate({ from: accountAddr });

    return NextResponse.json({ verified: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
