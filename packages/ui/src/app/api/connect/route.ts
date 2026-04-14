import { NextResponse } from "next/server";
import { getSandboxAccountAddress } from "@/lib/aztec";

export async function POST() {
  try {
    const address = await getSandboxAccountAddress();
    return NextResponse.json({ address: address.toString() });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
