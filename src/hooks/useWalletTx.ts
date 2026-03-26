"use client";

import { createWalletClient, custom, createPublicClient, http } from "viem";
import { bsc } from "viem/chains";
import { useCallback } from "react";
import { useWalletConnect } from "@/contexts/WalletConnectContext";
import BEAR_NFT from "@/const/bearNFT";

const bscChain = {
  ...bsc,
  rpcUrls: {
    default: {
      http: [BEAR_NFT.RPC || "https://bsc-dataseed.binance.org"],
    },
  },
};

/**
 * 通过 UniversalProvider 发送交易、切换链，以及等待交易回执
 */
/** UniversalProvider.request 需要 chain 参数，包装为 EIP-1193 兼容 */
function wrapProviderForChain(provider: unknown, chain: string) {
  const p = provider as { request(args: unknown, chain?: string): Promise<unknown> };
  return {
    request: (args: { method: string; params?: unknown }) =>
      p.request(args, chain),
  };
}

export function useWalletTx() {
  const { provider, address } = useWalletConnect();

  const sendTransaction = useCallback(
    async (params: {
      to: `0x${string}`;
      data?: `0x${string}`;
      value?: bigint;
      chainId?: number;
    }): Promise<`0x${string}`> => {
      if (!provider || !address) {
        throw new Error("Wallet not connected");
      }
      const chainId = params.chainId ?? BEAR_NFT.chainId;
      const wrappedProvider = wrapProviderForChain(provider, `eip155:${chainId}`);
      const walletClient = createWalletClient({
        account: address,
        chain: bscChain,
        transport: custom(wrappedProvider),
      });
      const hash = await walletClient.sendTransaction({
        to: params.to,
        data: params.data ?? "0x",
        value: params.value ?? BigInt(0),
        chainId,
      });
      return hash;
    },
    [provider, address]
  );

  const switchChain = useCallback(
    async (chainId: number): Promise<void> => {
      if (!provider) throw new Error("Wallet not connected");
      const wrapped = wrapProviderForChain(provider, `eip155:${chainId}`);
      const hexChainId = `0x${chainId.toString(16)}`;
      await wrapped.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexChainId }],
      });
    },
    [provider]
  );

  const publicClient = createPublicClient({
    chain: bscChain,
    transport: http(BEAR_NFT.RPC || "https://bsc-dataseed.binance.org"),
  });

  return {
    sendTransaction,
    switchChain,
    publicClient,
  };
}

