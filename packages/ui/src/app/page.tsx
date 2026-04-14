"use client";

/**
 * Main page — ZK Card prototype
 *
 * Layout:
 *  Left panel:  wallet connection + your card gallery
 *  Right panel: Bank (issue card) + ZK proof panel
 *
 * Learning notes are embedded as comments throughout.
 */

import { useCallback } from "react";
import { useAztec } from "@/hooks/useAztec";
import { WalletConnect } from "@/components/WalletConnect";
import { CreditCard, CreditCardSkeleton } from "@/components/CreditCard";
import { IssueCardForm } from "@/components/IssueCardForm";
import { ProveOwnership } from "@/components/ProveOwnership";

export default function Home() {
  const aztec = useAztec();

  const handleDeploy = useCallback(async () => {
    await aztec.deployContract();
  }, [aztec]);

  const hasContract = Boolean(aztec.contractAddress);

  return (
    <main className="min-h-screen p-6 md:p-10">
      {/* Header */}
      <header className="max-w-5xl mx-auto mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            ZK
          </div>
          <h1 className="text-2xl font-bold text-white">ZK Card</h1>
        </div>
        <p className="text-gray-400 text-sm max-w-xl">
          Proving payment card ownership using{" "}
          <span className="text-indigo-400 font-medium">Aztec Notes</span> and{" "}
          <span className="text-violet-400 font-medium">Zero-Knowledge proofs</span>.
          Cards are issued as private notes — only you can see them, but you can
          prove they exist to anyone, without revealing the card details.
        </p>
      </header>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ─── Left: Wallet + Cards ─────────────────────────── */}
        <div className="space-y-6">
          <WalletConnect
            status={aztec.status}
            address={aztec.address}
            contractAddress={aztec.contractAddress ?? ""}
            onConnect={aztec.connect}
            onAttachContract={aztec.attachContract}
            onDeployContract={handleDeploy}
            isLoading={aztec.isLoading}
          />

          {/* Card gallery */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Your Cards
              </h2>
              {hasContract && (
                <button
                  onClick={aztec.refreshCards}
                  disabled={aztec.isLoading}
                  className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors"
                >
                  Refresh
                </button>
              )}
            </div>

            {aztec.isLoading && aztec.cards.length === 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-2">
                <CreditCardSkeleton />
              </div>
            ) : aztec.cards.length === 0 ? (
              <div className="border border-dashed border-gray-700 rounded-2xl p-8 text-center">
                <p className="text-gray-500 text-sm">No cards yet.</p>
                <p className="text-gray-600 text-xs mt-1">
                  Ask a bank to issue you a card.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {aztec.cards.map((card, i) => (
                  <CreditCard key={i} card={card} />
                ))}
              </div>
            )}
          </div>

          {/* Error display */}
          {aztec.error && (
            <div className="bg-red-900/30 border border-red-700 rounded-xl px-4 py-3">
              <p className="text-xs text-red-300 font-medium">Error</p>
              <p className="text-xs text-red-400 mt-0.5 break-all">
                {aztec.error}
              </p>
            </div>
          )}
        </div>

        {/* ─── Right: Actions ───────────────────────────────── */}
        <div className="space-y-6">
          {/* ZK concept explainer */}
          <div className="bg-gray-900/60 border border-indigo-900/50 rounded-2xl p-5 space-y-2">
            <h3 className="text-sm font-semibold text-indigo-300">
              How it works
            </h3>
            <ol className="text-xs text-gray-400 space-y-1.5 list-decimal list-inside">
              <li>
                Bank calls <code className="text-indigo-300">issue_card()</code>{" "}
                — creates an encrypted CardNote for your address
              </li>
              <li>
                Note commitment goes into the{" "}
                <span className="text-violet-300">global note-hash tree</span>{" "}
                (visible on-chain, but preimage is hidden)
              </li>
              <li>
                Your PXE decrypts the log and stores the note locally
              </li>
              <li>
                You call <code className="text-indigo-300">prove_card_ownership()</code> —
                the circuit proves bank_id in ZK without revealing anything else
              </li>
            </ol>
          </div>

          {/* Issue card form (bank side) */}
          <IssueCardForm
            onIssue={async (params) => {
              await aztec.issueCard(params);
              await aztec.refreshCards();
            }}
            isLoading={aztec.isLoading}
            issuerAddress={aztec.address?.toString()}
          />

          {/* Prove ownership */}
          <ProveOwnership
            onProve={aztec.proveOwnership}
            isLoading={aztec.isLoading}
            defaultBankId={aztec.address ? aztec.address : ""}
          />
        </div>
      </div>
    </main>
  );
}
