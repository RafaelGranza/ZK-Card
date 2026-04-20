"use client";

import Link from "next/link";
import { useAztec } from "@/hooks/useAztec";
import { WalletConnect } from "@/components/WalletConnect";
import { CreditCard, CreditCardSkeleton } from "@/components/CreditCard";
import { ProveOwnership } from "@/components/ProveOwnership";

export default function UserPage() {
  const aztec = useAztec("user");

  return (
    <main className="min-h-screen p-6 md:p-10">
      <header className="max-w-2xl mx-auto mb-10">
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            ← Back
          </Link>
        </div>
        <div className="flex items-center gap-3 mt-3 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-lg">
            💳
          </div>
          <h1 className="text-2xl font-bold text-white">Cardholder</h1>
        </div>
        <p className="text-gray-400 text-sm">
          View your private card notes and generate ZK ownership proofs.
        </p>
      </header>

      <div className="max-w-2xl mx-auto space-y-6">
        <WalletConnect
          status={aztec.status}
          address={aztec.address}
          onConnect={aztec.connect}
          isLoading={aztec.isLoading}
        />

        {aztec.error && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl px-4 py-3">
            <p className="text-xs text-red-300 font-medium">Error</p>
            <p className="text-xs text-red-400 mt-0.5 break-all">
              {aztec.error}
            </p>
          </div>
        )}

        {aztec.status === "connected" && (
          <>
            {/* Card gallery */}
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                  Your Cards
                </h2>
                <button
                  onClick={aztec.refreshCards}
                  disabled={aztec.isLoading}
                  className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors"
                >
                  Refresh
                </button>
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

            <ProveOwnership
              onProve={aztec.proveOwnership}
              isLoading={aztec.isLoading}
              defaultBankId={aztec.peerAddress ?? ""}
            />
          </>
        )}
      </div>
    </main>
  );
}
