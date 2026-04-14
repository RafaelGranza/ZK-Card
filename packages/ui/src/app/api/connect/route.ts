import { NextResponse } from "next/server";
import { getSandboxWallet, getBankAddress, getUserAddress } from "@/lib/aztec";

export async function POST() {
  try {
    // Initialize PXE and register both accounts in one shot.
    await getSandboxWallet();
    const [bankAddress, userAddress] = await Promise.all([
      getBankAddress(),
      getUserAddress(),
    ]);
    return NextResponse.json({
      bankAddress: bankAddress.toString(),
      userAddress: userAddress.toString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
