"use client";

import { createContext, useMemo } from "react";
import { WalletConnectProvider, useWalletConnect } from "@/contexts/WalletConnectContext";
import { WalletAuthSync } from "./WalletAuthSync";

type WcClientForRelayer = {
  client?: { core?: { relayer?: { restartTransport: (url?: string) => Promise<void> } } };
} | null;

/** 暴露 UniversalProvider 的 client，供 WalletAuthSync 在页面可见时调用 relayer.restartTransport() */
export const UniversalProviderContext = createContext<WcClientForRelayer>(null);

function Web3ProviderInner({ children }: { children: React.ReactNode }) {
  const { client, isInitializing } = useWalletConnect();
  const wcClient = useMemo<WcClientForRelayer>(
    () => (client ? { client } : null),
    [client]
  );
  return (
    <UniversalProviderContext.Provider value={wcClient}>
      <WalletAuthSync>{children}</WalletAuthSync>
    </UniversalProviderContext.Provider>
  );
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WalletConnectProvider>
      <Web3ProviderContent>{children}</Web3ProviderContent>
    </WalletConnectProvider>
  );
}

function Web3ProviderContent({ children }: { children: React.ReactNode }) {
  const { isInitializing } = useWalletConnect();
  if (isInitializing) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ color: "#666" }}>Loading...</span>
      </div>
    );
  }
  return <Web3ProviderInner>{children}</Web3ProviderInner>;
}

