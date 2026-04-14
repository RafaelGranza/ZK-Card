"use client";

import type { CardNoteData } from "@/lib/contract";

interface CreditCardProps {
  card: CardNoteData;
  isVerified?: boolean; // bank is in the authorized_banks map
}

// Derive a stable gradient from the bankId string
function bankGradient(bankId: string): string {
  const gradients = [
    "from-violet-600 to-indigo-900",
    "from-emerald-600 to-teal-900",
    "from-rose-600 to-pink-900",
    "from-amber-600 to-orange-900",
    "from-cyan-600 to-sky-900",
  ];
  const idx =
    parseInt(bankId.slice(-4), 16) % gradients.length;
  return gradients[idx];
}

// Show a masked card number derived from the hash (for UI only — not the real number)
function maskedNumber(hash: string): string {
  const seg = hash.slice(2, 18); // 16 hex chars
  const digits = seg.replace(/[^0-9a-f]/gi, "0").slice(0, 16);
  const groups = [
    digits.slice(0, 4),
    "****",
    "****",
    digits.slice(12, 16),
  ];
  return groups.join("  ");
}

function formatMonth(m: number): string {
  return String(m).padStart(2, "0");
}

export function CreditCard({ card, isVerified = false }: CreditCardProps) {
  const gradient = bankGradient(card.bankId);
  const masked = maskedNumber(card.cardNumberHash);
  const expiry = `${formatMonth(card.expiryMonth)}/${String(card.expiryYear).slice(-2)}`;

  return (
    <div
      className={`
        relative w-80 h-48 rounded-2xl bg-gradient-to-br ${gradient}
        shadow-2xl font-card text-white overflow-hidden select-none
        transition-transform duration-300 hover:-translate-y-1
      `}
    >
      {/* Glossy overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl" />

      {/* Chip */}
      <div className="absolute top-8 left-6">
        <div className="w-10 h-8 rounded bg-amber-300/80 border border-amber-400/60 flex items-center justify-center">
          <div className="w-6 h-5 rounded-sm border border-amber-500/60 grid grid-cols-3 gap-px p-0.5">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="bg-amber-500/40 rounded-sm" />
            ))}
          </div>
        </div>
      </div>

      {/* ZK shield badge */}
      <div className="absolute top-6 right-6 flex items-center gap-1">
        {isVerified && (
          <span className="text-xs bg-green-400/30 border border-green-400/50 text-green-200 px-2 py-0.5 rounded-full">
            Verified Bank
          </span>
        )}
        <span className="text-xs bg-white/10 border border-white/20 px-2 py-0.5 rounded-full">
          ZK
        </span>
      </div>

      {/* Card number */}
      <div className="absolute bottom-16 left-6 text-lg tracking-widest font-bold opacity-90">
        {masked}
      </div>

      {/* Bottom row */}
      <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest opacity-60">
            Valid Thru
          </p>
          <p className="text-sm font-bold tracking-wider">{expiry}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest opacity-60">
            Limit
          </p>
          <p className="text-sm font-bold">
            ${card.creditLimit.toLocaleString()}
          </p>
        </div>
        {/* Card network circles */}
        <div className="flex items-center -space-x-2 opacity-80">
          <div className="w-8 h-8 rounded-full bg-red-500/80" />
          <div className="w-8 h-8 rounded-full bg-amber-400/80" />
        </div>
      </div>

      {/* Bank ID footer (truncated) */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/20 px-3 py-0.5">
        <p className="text-[8px] opacity-40 truncate">
          bank: {card.bankId}
        </p>
      </div>
    </div>
  );
}

/** Skeleton placeholder while cards are loading */
export function CreditCardSkeleton() {
  return (
    <div className="w-80 h-48 rounded-2xl bg-gray-800 animate-pulse shadow-xl" />
  );
}
