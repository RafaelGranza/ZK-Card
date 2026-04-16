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
        {/* Book cover */}
        <div className="sm:w-56 flex-shrink-0 bg-gradient-to-br from-amber-900 to-yellow-950 flex flex-col items-center justify-center p-8 gap-3 min-h-64">
          <div className="w-28 h-36 bg-amber-800 border-l-4 border-amber-600 rounded-sm shadow-2xl flex flex-col items-center justify-center p-2 text-center">
            <p className="text-amber-200 text-[9px] font-bold uppercase tracking-wide leading-tight">
              The Art of Computer Programming
            </p>
            <div className="my-2 w-8 border-t border-amber-600" />
            <p className="text-amber-400 text-[8px]">Vol. 1–4B</p>
            <p className="text-amber-500 text-[7px] mt-1">Knuth</p>
          </div>
          <span className="text-xs text-amber-700/80 font-mono">
            TAOCP
          </span>
        </div>

        {/* Details */}
        <div className="flex-1 p-8 flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-white text-xl font-bold leading-tight">
                  The Art of Computer Programming
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Donald E. Knuth — Volumes 1–4B
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-gray-600 line-through text-sm">$312</p>
                <p className="text-green-400 font-bold text-lg">Free</p>
              </div>
            </div>

            <p className="text-gray-400 text-sm leading-relaxed">
              The definitive reference on algorithms and data structures.
              Covers fundamental algorithms, seminumerical algorithms, sorting
              and searching, and combinatorial algorithms.
            </p>

            <div className="flex flex-wrap gap-2">
              {["Algorithms", "Data Structures", "CS Theory", "4 volumes"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="text-xs text-indigo-400 bg-indigo-900/30 border border-indigo-800/50 px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-sm">🔐</span>
              Claim free copy with ZK Card
            </button>
            <p className="text-center text-xs text-gray-600">
              Prove card ownership without revealing your card details
            </p>
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
              icon: "⬇",
              label: "Download",
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
