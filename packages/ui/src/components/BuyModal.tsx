"use client";

import { useState, useEffect } from "react";
import { useAztec } from "@/hooks/useAztec";
import type { CardNoteData } from "@/lib/contract";

type Step = "loading" | "select" | "proving" | "success" | "error";

interface BuyModalProps {
  onClose: () => void;
}

// Derive a stable gradient from bankId (mirrors CreditCard.tsx)
function bankGradient(bankId: string): string {
  const gradients = [
    "from-violet-600 to-indigo-900",
    "from-emerald-600 to-teal-900",
    "from-rose-600 to-pink-900",
    "from-amber-600 to-orange-900",
    "from-cyan-600 to-sky-900",
  ];
  return gradients[parseInt(bankId.slice(-4), 16) % gradients.length];
}

const WHITEPAPER_URL = "https://ethereum.org/whitepaper/";

export function BuyModal({ onClose }: BuyModalProps) {
  const aztec = useAztec("user");
  const [step, setStep] = useState<Step>("loading");
  const [provenBankId, setProvenBankId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-connect and load cards on mount
  useEffect(() => {
    async function init() {
      try {
        await aztec.connect();
      } catch {
        // already connected — ignore
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If connect() fails internally (sets status="error" without throwing), show error
  useEffect(() => {
    if (aztec.status === "error") {
      setErrorMsg(aztec.error ?? "Connection failed");
      setStep("error");
    }
  }, [aztec.status, aztec.error]);

  // Once address is set, load cards and advance to select
  useEffect(() => {
    if (!aztec.address) return;
    aztec
      .refreshCards()
      .then(() => setStep("select"))
      .catch((e) => {
        setErrorMsg(e instanceof Error ? e.message : String(e));
        setStep("error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aztec.address]);

  async function handleSelectCard(card: CardNoteData) {
    setStep("proving");
    try {
      await aztec.proveOwnership(card.bankId);
      setProvenBankId(card.bankId);
      setStep("success");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setStep("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
              ZK
            </div>
            <span className="text-white font-semibold text-sm">
              Verify ownership to claim
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 min-h-52">
          {/* STEP: loading */}
          {step === "loading" && (
            <div className="flex items-center justify-center py-10">
              <p className="text-indigo-400 text-sm animate-pulse">
                Connecting wallet…
              </p>
            </div>
          )}

          {/* STEP: select */}
          {step === "select" && (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                Select a card to prove ownership. No card details will be
                shared.
              </p>

              {aztec.cards.length === 0 && (
                <div className="text-center py-8 border border-dashed border-gray-700 rounded-xl">
                  <p className="text-gray-500 text-sm">No cards found.</p>
                  <p className="text-gray-600 text-xs mt-1">
                    Get a card issued from the Bank Portal first.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {aztec.cards.map((card, i) => (
                  <CardRow
                    key={i}
                    card={card}
                    onClick={() => handleSelectCard(card)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* STEP: proving */}
          {step === "proving" && (
            <div className="flex flex-col items-center justify-center py-10 gap-5">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-900" />
                <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-lg">
                  🔐
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-white font-semibold">Generating ZK proof…</p>
                <p className="text-gray-500 text-xs max-w-xs">
                  Card number, expiry and limit stay private inside the circuit.
                </p>
              </div>
            </div>
          )}

          {/* STEP: success */}
          {step === "success" && provenBankId && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-900/40 border border-green-700 rounded-full flex items-center justify-center text-green-400 text-lg">
                  ✓
                </div>
                <div>
                  <p className="text-white font-semibold">Ownership verified</p>
                  <p className="text-gray-500 text-xs">
                    Card details were never revealed.
                  </p>
                </div>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">public output</span>
                  <span className="text-green-400">bank_id</span>
                </div>
                <div className="text-indigo-300 truncate">{provenBankId}</div>
                <div className="border-t border-gray-700 pt-2 space-y-1">
                  {[
                    "card_number_hash",
                    "expiry_year",
                    "expiry_month",
                    "credit_limit",
                  ].map((f) => (
                    <div key={f} className="flex justify-between">
                      <span className="text-gray-500">{f}</span>
                      <span className="text-gray-600">hidden</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => window.open(WHITEPAPER_URL, "_blank")}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <span>🔓</span>
                Open Ethereum Whitepaper
              </button>
            </div>
          )}

          {/* STEP: error */}
          {step === "error" && (
            <div className="space-y-4">
              <div className="bg-red-900/20 border border-red-800 rounded-xl p-4">
                <p className="text-red-400 text-sm font-semibold mb-1">
                  Failed
                </p>
                <p className="text-red-300 text-xs font-mono break-all">
                  {errorMsg}
                </p>
              </div>
              <button
                onClick={() => {
                  setErrorMsg(null);
                  setStep("select");
                }}
                className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white py-3 rounded-xl text-sm"
              >
                Try again
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-800 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
          <p className="text-xs text-gray-600">
            Proof runs locally in PXE — card data never leaves your device.
          </p>
        </div>
      </div>
    </div>
  );
}

function CardRow({
  card,
  onClick,
}: {
  card: CardNoteData;
  onClick: () => void;
}) {
  const gradient = bankGradient(card.bankId);
  const last4 = card.cardNumberHash.slice(-4).toUpperCase();
  const expiry = `${String(card.expiryMonth).padStart(2, "0")}/${String(card.expiryYear).slice(-2)}`;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-indigo-500 rounded-xl p-3 transition-all group text-left"
    >
      {/* Mini card chip */}
      <div
        className={`w-12 h-8 rounded-lg bg-gradient-to-br ${gradient} flex-shrink-0 flex items-center justify-center`}
      >
        <span className="text-white text-[9px] font-bold tracking-wider">
          ZK
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">
          {card.label ?? "ZK Card"}
        </p>
        <p className="text-gray-500 text-xs font-mono">
          **** {last4} · {expiry} · ${card.creditLimit.toLocaleString()} limit
        </p>
      </div>

      <span className="text-gray-600 group-hover:text-indigo-400 transition-colors text-sm flex-shrink-0">
        →
      </span>
    </button>
  );
}
