"use client";

/**
 * ProveOwnership — Demonstrates the ZK ownership proof.
 *
 * What happens when you click "Prove":
 *  1. The PXE finds one of your CardNotes whose bank_id matches the input.
 *  2. The ACIR circuit (compiled from prove_card_ownership in Noir) runs
 *     locally in your PXE — no transaction is submitted.
 *  3. The circuit verifies: you own a note from that bank AND the card is not expired.
 *  4. Success means the constraints held. Nothing is revealed to the network.
 *
 * This is "selective disclosure": you prove a property of your private data
 * without revealing the data itself.
 */

import { useState } from "react";

interface ProveOwnershipProps {
  onProve: (bankId: string) => Promise<void>;
  isLoading: boolean;
  defaultBankId?: string;
}

type ProofStatus = "idle" | "proving" | "success" | "error";

export function ProveOwnership({
  onProve,
  isLoading,
  defaultBankId = "",
}: ProveOwnershipProps) {
  const [bankId, setBankId] = useState(defaultBankId);
  const [status, setStatus] = useState<ProofStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function handleProve() {
    if (!bankId) return;
    setStatus("proving");
    setErrorMsg("");
    try {
      await onProve(bankId);
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-4 w-full max-w-md">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <span className="text-2xl">🔐</span>
        Prove Card Ownership
      </h2>

      <div className="bg-gray-800/50 rounded-xl p-3 space-y-1 text-xs text-gray-400">
        <p className="font-semibold text-gray-300">What this proves (in ZK):</p>
        <ul className="space-y-0.5 list-disc list-inside">
          <li>You possess a card note from the specified bank</li>
          <li>The note exists in the global note-hash tree</li>
          <li>The card has not expired</li>
        </ul>
        <p className="font-semibold text-gray-300 mt-2">What stays private:</p>
        <ul className="space-y-0.5 list-disc list-inside text-indigo-300">
          <li>card_number_hash</li>
          <li>expiry_year / expiry_month</li>
          <li>credit_limit</li>
        </ul>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">
          Bank ID (bank&apos;s Aztec address as hex Field)
        </label>
        <input
          type="text"
          value={bankId}
          onChange={(e) => setBankId(e.target.value)}
          placeholder="0x..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 font-mono focus:outline-none focus:border-violet-500"
        />
      </div>

      <button
        onClick={handleProve}
        disabled={isLoading || status === "proving" || !bankId}
        className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {status === "proving" ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating proof...
          </>
        ) : (
          "Generate ZK Proof"
        )}
      </button>

      {status === "success" && (
        <div className="bg-green-900/30 border border-green-700 rounded-xl p-3 space-y-1 animate-fade-in">
          <p className="text-xs font-semibold text-green-300">
            Proof verified locally in PXE
          </p>
          <p className="text-xs text-gray-400">Bank proved:</p>
          <p className="text-xs font-mono text-green-200 break-all">
            {bankId}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            Circuit ran locally — card number, expiry and limit were never
            revealed.
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-3 animate-fade-in">
          <p className="text-xs font-semibold text-red-300">Proof failed</p>
          <p className="text-xs text-red-400 break-all">{errorMsg}</p>
        </div>
      )}
    </div>
  );
}
