/**
 * BSC (eip155:56) only - required namespaces for WalletConnect
 */
export const BSC_CHAIN = "eip155:56";

const EIP155_METHODS = [
  "eth_sendTransaction",
  "personal_sign",
  "eth_signTypedData",
  "eth_signTypedData_v4",
  "eth_signTransaction",
  "wallet_switchEthereumChain",
  "wallet_addEthereumChain",
] as const;

const EIP155_EVENTS = ["chainChanged", "accountsChanged"] as const;

export function getRequiredNamespaces(chains: string[] = [BSC_CHAIN]) {
  return {
    eip155: {
      methods: [...EIP155_METHODS],
      chains,
      events: [...EIP155_EVENTS],
    },
  };
}
