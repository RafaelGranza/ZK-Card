"use client";

/**
 * IssueCardForm — Simulates a bank issuing a card to a holder.
 *
 * In a real scenario, only an authorized bank would submit this tx.
 * For the prototype, any connected wallet can issue (demonstrating the
 * mechanism before adding on-chain bank authorization).
 *
 * What happens on submit:
 *  1. The card number is hashed locally with keccak (placeholder; ideally
 *     Poseidon2 in a WASM module).
 *  2. `issue_card` is called on the ZKCard contract.
 *  3. The PXE generates a ZK proof and sends the tx to the sandbox.
 *  4. The holder's PXE discovers the encrypted note and stores it locally.
 */

import { useState } from "react";
import type { IssueCardParams } from "@/hooks/useAztec";

interface IssueCardFormProps {
  onIssue: (params: IssueCardParams) => Promise<void>;
  isLoading: boolean;
  issuerAddress?: string;
  defaultHolderAddress?: string;
}

// BN254 Fr modulus — Noir's Field type must be < this value.
// SHA-256 is 256 bits; the modulus is ~254 bits, so ~25% of hashes would overflow
// without the modulo. We reduce here so the value is always a valid Noir Field.
const BN254_FR_MODULUS = 21888242871839275222246405745257275088696311157297823662689037894645226208583n;

// Naive hash for demo — replaces Poseidon2 which requires WASM.
// Reduces mod Fr modulus so the value is always a valid Noir Field.
async function hashCardNumber(cardNumber: string): Promise<bigint> {
  const enc = new TextEncoder().encode(cardNumber);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  const hex = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return BigInt("0x" + hex) % BN254_FR_MODULUS;
}

export function IssueCardForm({
  onIssue,
  isLoading,
  issuerAddress,
  defaultHolderAddress = "",
}: IssueCardFormProps) {
  const [holderAddr, setHolderAddr] = useState(defaultHolderAddress);
  const [cardNumber, setCardNumber] = useState("4532 0151 1283 0366");
  const [expiryYear, setExpiryYear] = useState(2028);
  const [expiryMonth, setExpiryMonth] = useState(12);
  const [creditLimit, setCreditLimit] = useState(500000); // $5000.00 in cents
  const [status, setStatus] = useState<"idle" | "pending" | "done" | "error">(
    "idle"
  );
  const [txNote, setTxNote] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("pending");
    setTxNote("");
    try {
      const cardNumberHashBig = await hashCardNumber(
        cardNumber.replace(/\s/g, "")
      );
      await onIssue({
        holderAddress: holderAddr,
        cardNumberHash: cardNumberHashBig.toString(),
        expiryYear,
        expiryMonth,
        creditLimit: BigInt(creditLimit).toString(),
      });
      setStatus("done");
      setTxNote("Card issued! The holder's PXE will discover the note.");
    } catch (err) {
      setStatus("error");
      setTxNote(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-4 w-full max-w-md"
    >
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <span className="text-2xl">🏦</span>
        Issue Card (Bank)
      </h2>

      {issuerAddress && (
        <p className="text-xs text-gray-500 break-all">
          Issuing as: <span className="text-indigo-400">{issuerAddress}</span>
        </p>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Holder Address
          </label>
          <input
            type="text"
            value={holderAddr}
            onChange={(e) => setHolderAddr(e.target.value)}
            placeholder="0x..."
            required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Card Number (will be hashed client-side)
          </label>
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            maxLength={19}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-card focus:outline-none focus:border-indigo-500"
          />
          <p className="text-[10px] text-gray-600 mt-1">
            Never sent on-chain — only its hash is stored in the note
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Expiry Month
            </label>
            <input
              type="number"
              min={1}
              max={12}
              value={expiryMonth}
              onChange={(e) => setExpiryMonth(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Expiry Year
            </label>
            <input
              type="number"
              min={2025}
              max={2040}
              value={expiryYear}
              onChange={(e) => setExpiryYear(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Credit Limit (cents, e.g. 500000 = $5,000)
          </label>
          <input
            type="number"
            value={creditLimit}
            onChange={(e) => setCreditLimit(Number(e.target.value))}
            min={1}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || status === "pending"}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors"
      >
        {status === "pending" ? "Generating ZK proof..." : "Issue Card"}
      </button>

      {txNote && (
        <p
          className={`text-xs rounded-lg px-3 py-2 ${
            status === "done"
              ? "bg-green-900/40 text-green-300 border border-green-700"
              : "bg-red-900/40 text-red-300 border border-red-700"
          }`}
        >
          {txNote}
        </p>
      )}
    </form>
  );
}
