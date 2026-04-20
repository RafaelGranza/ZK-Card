/**
 * GET  /api/cards?owner=<address>  — fetch all cards for an owner (no tx)
 * POST /api/cards                  — issue a new card (private tx)
 *
 * GET — calls `get_cards` (utility/unconstrained):
 *   `.simulate()` runs locally, returns SimulationResult.result directly.
 *   No proof generated, no tx submitted. Data is the note plaintext from the PXE.
 *
 * POST — calls `issue_card` (private function):
 *   `.send({ from: bankAddress })` generates a ZK proof + encrypted note log
 *   and submits them to the sequencer. Waits for the tx to be mined.
 */

import { NextResponse } from "next/server";
import { getContract } from "@/lib/contract";
import { getSandboxAccountAddress } from "@/lib/aztec";
import { AztecAddress } from "@aztec/aztec.js/addresses";
import type { CardNoteData } from "@/lib/contract";

// GET /api/cards?owner=<address>
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerStr = searchParams.get("owner");
    if (!ownerStr) {
      return NextResponse.json(
        { error: "missing owner param" },
        { status: 400 },
      );
    }

    const contract = getContract();
    const owner = AztecAddress.fromString(ownerStr);

    // Fetch all pages. get_cards returns ([CardNote; MAX_NOTES_PER_PAGE], bool)
    // where the bool signals that another page may exist.
    const allRaw: RawCard[] = [];
    let page = 0;
    let hasMore = true;
    while (hasMore) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const simResult = await contract.methods
        .get_cards(owner, page)
        .simulate({ from: owner });
      const [rawCards, more] = simResult.result as [RawCard[], boolean];
      allRaw.push(...rawCards.filter((c) => BigInt(c.bank_id) !== BigInt(0)));
      hasMore = more;
      page++;
    }

    const cards: CardNoteData[] = allRaw.map(parseCard);

    return NextResponse.json({ cards });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/cards
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      holderAddress,
      cardNumberHash,
      expiryYear,
      expiryMonth,
      creditLimit,
    } = body as {
      holderAddress: string;
      cardNumberHash: string;
      expiryYear: number;
      expiryMonth: number;
      creditLimit: string;
    };

    if (!holderAddress) {
      return NextResponse.json({ error: "missing holderAddress" }, { status: 400 });
    }
    if (!cardNumberHash) {
      return NextResponse.json({ error: "missing cardNumberHash" }, { status: 400 });
    }
    const month = Number(expiryMonth);
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: "expiryMonth must be 1–12" }, { status: 400 });
    }
    const year = Number(expiryYear);
    if (!Number.isInteger(year) || year < 2024 || year > 2050) {
      return NextResponse.json({ error: "expiryYear must be 2024–2050" }, { status: 400 });
    }
    const limit = BigInt(creditLimit);
    if (limit <= 0n) {
      return NextResponse.json({ error: "creditLimit must be positive" }, { status: 400 });
    }

    const bankAddress = await getSandboxAccountAddress();
    const contract = getContract();
    const holder = AztecAddress.fromString(holderAddress);

    // Private function: send({ from }) generates ZK proof + submits tx
    await contract.methods
      .issue_card(
        holder,
        BigInt(cardNumberHash),
        expiryYear,
        expiryMonth,
        BigInt(creditLimit),
      )
      .send({ from: bankAddress });

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface RawCard {
  card_number_hash: bigint | string | number;
  bank_id: bigint | string | number;
  // ABI decoder returns u32 fields as bigint
  expiry_year: bigint | number;
  expiry_month: bigint | number;
  credit_limit: bigint | string | number;
}

function parseCard(raw: RawCard): CardNoteData {
  return {
    cardNumberHash:
      "0x" + BigInt(raw.card_number_hash).toString(16).padStart(64, "0"),
    bankId: "0x" + BigInt(raw.bank_id).toString(16).padStart(64, "0"),
    expiryYear: Number(raw.expiry_year),
    expiryMonth: Number(raw.expiry_month),
    creditLimit: Number(BigInt(raw.credit_limit)) / 100,
  };
}
