"use client";

/**
 * useAztec — React hook that calls Next.js API Routes for all Aztec operations.
 *
 * Architecture:
 *   Browser (this hook) <──fetch──> Next.js API routes (Node.js) <──> Aztec sandbox
 *
 * Why this separation?
 *   @aztec/aztec.js uses Node.js built-ins (crypto, leveldown, fs) that
 *   can't run in the browser. All Aztec interactions happen in the server-side
 *   API routes. The hook just manages UI state and makes fetch() calls.
 */

import { useState, useCallback } from "react";
import type { CardNoteData } from "@/lib/contract";

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export type AztecRole = "bank" | "user";

export interface IssueCardParams {
  holderAddress: string;
  cardNumberHash: string; // hex BigInt string
  expiryYear: number;
  expiryMonth: number;
  creditLimit: string; // BigInt as string (cents)
}

export interface AztecState {
  status: ConnectionStatus;
  /** Address for this role (bank or user) */
  address: string | null;
  /** The other account's address — bank sees user address, user sees bank address */
  peerAddress: string | null;
  contractAddress: string | null;
  cards: CardNoteData[];
  isLoading: boolean;
  error: string | null;
  // Actions
  connect: () => Promise<void>;
  deployContract: () => Promise<void>;
  attachContract: (address: string) => Promise<void>;
  issueCard: (params: IssueCardParams) => Promise<void>;
  proveOwnership: (bankId: string) => Promise<string>;
  refreshCards: () => Promise<void>;
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? `API error ${res.status}`);
  }
  return data as T;
}

export function useAztec(role: AztecRole = "bank"): AztecState {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [address, setAddress] = useState<string | null>(null);
  const [peerAddress, setPeerAddress] = useState<string | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [cards, setCards] = useState<CardNoteData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withLoading = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T> => {
      setIsLoading(true);
      setError(null);
      try {
        return await fn();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const connect = useCallback(async () => {
    setStatus("connecting");
    try {
      const { bankAddress, userAddress } = await withLoading(() =>
        api<{ bankAddress: string; userAddress: string }>("/api/connect", {
          method: "POST",
        })
      );
      if (role === "bank") {
        setAddress(bankAddress);
        setPeerAddress(userAddress);
      } else {
        setAddress(userAddress);
        setPeerAddress(bankAddress);
      }
      setStatus("connected");
    } catch {
      setStatus("error");
    }
  }, [role, withLoading]);

  const deployContract = useCallback(async () => {
    const { contractAddress: addr } = await withLoading(() =>
      api<{ contractAddress: string }>("/api/deploy", { method: "POST" })
    );
    setContractAddress(addr);
  }, [withLoading]);

  const attachContract = useCallback(
    async (existingAddress: string) => {
      const { contractAddress: addr } = await withLoading(() =>
        api<{ contractAddress: string }>("/api/deploy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ existingAddress }),
        })
      );
      setContractAddress(addr);
    },
    [withLoading]
  );

  const issueCard = useCallback(
    async (params: IssueCardParams) => {
      await withLoading(() =>
        api<{ success: boolean }>("/api/cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        })
      );
    },
    [withLoading]
  );

  const proveOwnership = useCallback(
    async (bankId: string): Promise<string> => {
      const { provenBankId } = await withLoading(() =>
        api<{ provenBankId: string }>("/api/prove", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bankId }),
        })
      );
      return provenBankId;
    },
    [withLoading]
  );

  const refreshCards = useCallback(async () => {
    if (!address) return;
    const { cards: c } = await withLoading(() =>
      api<{ cards: CardNoteData[] }>(`/api/cards?owner=${address}`)
    );
    setCards(c);
  }, [address, withLoading]);

  return {
    status,
    address,
    peerAddress,
    contractAddress,
    cards,
    isLoading,
    error,
    connect,
    deployContract,
    attachContract,
    issueCard,
    proveOwnership,
    refreshCards,
  };
}
