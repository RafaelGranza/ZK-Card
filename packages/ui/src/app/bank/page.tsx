"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useAztec } from "@/hooks/useAztec";
import { WalletConnect } from "@/components/WalletConnect";
import { IssueCardForm } from "@/components/IssueCardForm";

export default function BankPage() {
  const aztec = useAztec("bank");

  const handleDeploy = useCallback(async () => {
    await aztec.deployContract();
  }, [aztec]);

  return (
    <main className="min-h-screen p-6 md:p-10">
      <header className="max-w-2xl mx-auto mb-10">
        <div className="flex items-center gap-3 mb-1">
          <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            ← Back
          </Link>
        </div>
        <div className="flex items-center gap-3 mt-3 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-lg">
            🏦
          </div>
          <h1 className="text-2xl font-bold text-white">Bank Portal</h1>
        </div>
        <p className="text-gray-400 text-sm">
          Deploy the ZKCard contract and issue private card notes to holders.
        </p>
      </header>

      <div className="max-w-2xl mx-auto space-y-6">
        <WalletConnect
          status={aztec.status}
          address={aztec.address}
          contractAddress={aztec.contractAddress ?? ""}
          onConnect={aztec.connect}
          onAttachContract={aztec.attachContract}
          onDeployContract={handleDeploy}
          isLoading={aztec.isLoading}
          showDeploy={true}
        />

        {aztec.error && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl px-4 py-3">
            <p className="text-xs text-red-300 font-medium">Error</p>
            <p className="text-xs text-red-400 mt-0.5 break-all">{aztec.error}</p>
          </div>
        )}

        {aztec.status === "connected" && aztec.contractAddress && (
          <IssueCardForm
            onIssue={aztec.issueCard}
            isLoading={aztec.isLoading}
            issuerAddress={aztec.address ?? undefined}
            defaultHolderAddress={aztec.peerAddress ?? undefined}
          />
        )}
      </div>
    </main>
  );
}
