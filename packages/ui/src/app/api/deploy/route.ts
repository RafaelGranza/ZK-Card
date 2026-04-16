import { NextResponse } from "next/server";
import { getSandboxWallet, getSandboxAccountAddress } from "@/lib/aztec";
import { deployZKCard, getContractAddress, attachZKCard } from "@/lib/contract";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const wallet = await getSandboxWallet();
    const admin = await getSandboxAccountAddress();

    let address: string;

    if (body.existingAddress) {
      await attachZKCard(body.existingAddress, wallet);
      address = body.existingAddress;
    } else {
      const existing = getContractAddress();
      if (existing) {
        address = existing;
      } else {
        const contract = await deployZKCard(wallet, admin);
        address = contract.address.toString();
      }
    }

    return NextResponse.json({ contractAddress: address });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
