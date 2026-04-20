import { NextResponse } from "next/server";
import { AztecAddress } from "@aztec/aztec.js/addresses";
import { getSandboxWallet, clearWalletCache } from "@/lib/aztec";
import { getContractAddress, clearContractCache } from "@/lib/contract";

export async function GET() {
  let wallet;
  try {
    wallet = await getSandboxWallet();
  } catch {
    return NextResponse.json({ status: "offline" });
  }

  const address = getContractAddress();
  if (!address) {
    return NextResponse.json({ status: "not-deployed" });
  }

  // Verify the contract still exists — catches sandbox restarts that wipe chain state.
  // The embedded PXE synced to the old chain; clear it so next request gets a fresh one.
  const { instance } = await wallet.getContractMetadata(
    AztecAddress.fromString(address),
  );
  if (!instance) {
    clearWalletCache();
    clearContractCache();
    return NextResponse.json({ status: "not-deployed" });
  }

  return NextResponse.json({ status: "ready", address });
}
