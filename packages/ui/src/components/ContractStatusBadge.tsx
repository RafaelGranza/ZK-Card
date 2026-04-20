"use client";

import { useState, useEffect, useCallback } from "react";

type Status =
  | "checking"
  | "offline"
  | "not-deployed"
  | "deploying"
  | "ready"
  | "deploy-error";

const POLL_INTERVAL = 5000;

export function ContractStatusBadge() {
  const [status, setStatus] = useState<Status>("checking");
  const [address, setAddress] = useState<string | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const check = useCallback(async () => {
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      setStatus(data.status);
      setAddress(data.address ?? null);
    } catch {
      setStatus("offline");
    }
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [check]);

  async function handleDeploy() {
    setStatus("deploying");
    setDeployError(null);
    try {
      const res = await fetch("/api/deploy", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setStatus("ready");
      check();
    } catch (e) {
      setDeployError(e instanceof Error ? e.message : String(e));
      setStatus("deploy-error");
    }
  }

  const dot: Record<Status, string> = {
    checking: "bg-gray-500 animate-pulse",
    offline: "bg-gray-600",
    "not-deployed": "bg-red-500",
    deploying: "bg-yellow-400 animate-pulse",
    ready: "bg-green-400",
    "deploy-error": "bg-red-500",
  };

  const label: Record<Status, string> = {
    checking: "Checking…",
    offline: "Sandbox offline",
    "not-deployed": "Deploy contract",
    deploying: "Deploying…",
    ready: "Contract ready",
    "deploy-error": "Deploy failed — retry",
  };

  const clickable = status === "not-deployed" || status === "deploy-error";

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <button
        onClick={clickable ? handleDeploy : undefined}
        onMouseEnter={() =>
          (status === "ready" || status === "deploy-error") &&
          setShowTooltip(true)
        }
        onMouseLeave={() => setShowTooltip(false)}
        disabled={
          status === "deploying" ||
          status === "checking" ||
          status === "offline"
        }
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
          bg-gray-900/90 border backdrop-blur-sm transition-all
          ${
            clickable
              ? "border-red-800 text-red-400 hover:bg-gray-800 cursor-pointer"
              : status === "ready"
                ? "border-gray-700 text-gray-400 cursor-default"
                : "border-gray-800 text-gray-500 cursor-default"
          }
        `}
        title={
          status === "deploy-error" && deployError ? deployError : undefined
        }
      >
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot[status]}`}
        />
        {label[status]}
      </button>

      {showTooltip && status === "ready" && address && (
        <div className="absolute bottom-full right-0 mb-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono text-gray-400 whitespace-nowrap shadow-xl">
          {address.slice(0, 10)}…{address.slice(-8)}
        </div>
      )}

      {showTooltip && status === "deploy-error" && deployError && (
        <div className="absolute bottom-full right-0 mb-2 bg-gray-800 border border-red-800 rounded-lg px-3 py-2 text-xs text-red-400 max-w-xs shadow-xl">
          {deployError}
        </div>
      )}
    </div>
  );
}
