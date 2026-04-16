"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 gap-10">
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
            ZK
          </div>
          <h1 className="text-3xl font-bold text-white">ZK Card</h1>
        </div>
        <p className="text-gray-400 text-sm max-w-sm">
          Private credit card ownership proofs using{" "}
          <span className="text-indigo-400 font-medium">Aztec Notes</span> and{" "}
          <span className="text-violet-400 font-medium">Zero-Knowledge proofs</span>.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm flex-wrap">
        <Link
          href="/bank"
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl p-6 text-center transition-colors group"
        >
          <div className="text-3xl mb-2">🏦</div>
          <p className="font-semibold text-base">Bank Portal</p>
          <p className="text-xs text-indigo-200 mt-1">Deploy contract, issue cards</p>
        </Link>

        <Link
          href="/user"
          className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white rounded-2xl p-6 text-center transition-colors group"
        >
          <div className="text-3xl mb-2">💳</div>
          <p className="font-semibold text-base">Cardholder</p>
          <p className="text-xs text-gray-400 mt-1">View cards, prove ownership</p>
        </Link>

        <Link
          href="/store"
          className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white rounded-2xl p-6 text-center transition-colors group"
        >
          <div className="text-3xl mb-2">📚</div>
          <p className="font-semibold text-base">ZK Store</p>
          <p className="text-xs text-gray-400 mt-1">Buy with private proof</p>
        </Link>
      </div>
    </main>
  );
}
