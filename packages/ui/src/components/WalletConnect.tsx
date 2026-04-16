"use client";

import type { ConnectionStatus } from "@/hooks/useAztec";

interface WalletConnectProps {
  status: ConnectionStatus;
  address: string | null;
  onConnect: () => void;
  isLoading: boolean;
}

const statusColors: Record<ConnectionStatus, string> = {
  disconnected: "bg-gray-500",
  connecting:   "bg-yellow-500 animate-pulse",
  connected:    "bg-green-500",
  error:        "bg-red-500",
};

const statusLabels: Record<ConnectionStatus, string> = {
  disconnected: "Disconnected",
  connecting:   "Connecting to sandbox...",
  connected:    "Connected",
  error:        "Connection error",
};

export function WalletConnect({ status, address, onConnect, isLoading }: WalletConnectProps) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${statusColors[status]}`} />
          <span className="text-sm text-gray-300">{statusLabels[status]}</span>
        </div>

        {status !== "connected" && (
          <button
            onClick={onConnect}
            disabled={isLoading || status === "connecting"}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            Connect
          </button>
        )}
      </div>

      {status === "connected" && address && (
        <div className="bg-gray-800 rounded-xl px-4 py-2.5">
          <p className="text-[10px] text-gray-500 mb-0.5">Wallet address</p>
          <p className="text-xs font-mono text-indigo-300 break-all">{address}</p>
        </div>
      )}

      {status !== "connected" && (
        <p className="text-[10px] text-gray-600">
          Requires a local Aztec node at localhost:8080.{" "}
          <code className="text-gray-500">aztec start --local-network</code>
        </p>
      )}
    </div>
  );
}
