"use client";

import { useState } from "react";
import Link from "next/link";
import { BuyModal } from "@/components/BuyModal";

export default function StorePage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      {/* Nav */}
      <div className="flex items-center justify-between mb-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors text-sm"
        >
          ← Home
        </Link>
        <span className="text-xs text-gray-600 border border-gray-800 px-3 py-1 rounded-full">
          ZK Store — prototype
        </span>
      </div>

      {/* Product card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col sm:flex-row gap-0">
        {/* Cover */}
        <div className="sm:w-56 flex-shrink-0 bg-gradient-to-br from-indigo-950 to-violet-950 flex flex-col items-center justify-center p-8 gap-3 min-h-64">
          <div className="w-28 h-36 bg-indigo-900 border-l-4 border-indigo-400 rounded-sm shadow-2xl flex flex-col items-center justify-center p-3 text-center gap-1">
            <span className="text-indigo-300 text-2xl">♦</span>
            <p className="text-indigo-200 text-[8px] font-bold uppercase tracking-wide leading-tight">
              Ethereum
            </p>
            <p className="text-indigo-300 text-[7px] leading-tight">
              A Next-Generation Smart Contract Platform
            </p>
            <div className="my-1 w-8 border-t border-indigo-600" />
            <p className="text-indigo-500 text-[7px]">Buterin</p>
          </div>
          <span className="text-xs text-indigo-800/80 font-mono">
            whitepaper
          </span>
        </div>

        {/* Details */}
        <div className="flex-1 p-8 flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-white text-xl font-bold leading-tight">
                  Ethereum Whitepaper
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Vitalik Buterin — 2013
                </p>
              </div>
              <div className="text-right flex-shrink-0 space-y-1">
                <span className="block text-xs font-semibold text-red-400 bg-red-900/30 border border-red-800/50 px-2 py-0.5 rounded-full">
                  Restricted
                </span>
              </div>
            </div>

            <p className="text-gray-400 text-sm leading-relaxed">
              The original paper proposing a Turing-complete blockchain for
              smart contracts. Access is restricted to verified ZK Card holders.
            </p>

            <div className="flex flex-wrap gap-2">
              {["Smart Contracts", "EVM", "DApps", "2013"].map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-indigo-400 bg-indigo-900/30 border border-indigo-800/50 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 space-y-0.5">
              <p className="text-xs text-gray-400 font-semibold">
                For ZK Card holders only
              </p>
              <p className="text-xs text-gray-600">
                Prove ZK Card ownership, reveal nothing
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-sm">🔐</span>
              Prove ownership to access
            </button>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="mt-6 bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">
          How ZK verification works
        </p>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              icon: "💳",
              label: "Select card",
              desc: "Pick any card from your ZK wallet",
            },
            {
              icon: "🔐",
              label: "Prove ownership",
              desc: "ZK proof runs locally in your PXE",
            },
            {
              icon: "🔓",
              label: "Access",
              desc: "Only bank ID is revealed to the store",
            },
          ].map((step) => (
            <div key={step.label} className="text-center space-y-2">
              <div className="text-2xl">{step.icon}</div>
              <p className="text-white text-xs font-semibold">{step.label}</p>
              <p className="text-gray-600 text-xs">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {showModal && <BuyModal onClose={() => setShowModal(false)} />}
    </main>
  );
}
