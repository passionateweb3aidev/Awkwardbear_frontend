"use client";

import { MobileWalletModal } from "@/components/MobileWalletModal";
import BEAR_NFT from "@/const/bearNFT";
import { BSC_CHAIN, getRequiredNamespaces } from "@/helpers/namespaces";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { bsc } from "@reown/appkit/networks";
import { createAppKit } from "@reown/appkit/react";
import { SessionTypes } from "@walletconnect/types";
import {
  ConnectParams,
  IUniversalProvider,
  NamespaceConfig,
  UniversalProvider,
} from "@walletconnect/universal-provider";
import { getSdkError } from "@walletconnect/utils";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";

type Client = IUniversalProvider["client"];
type AppKit = ReturnType<typeof createAppKit>;
type WalletRequestArgs = {
  method: string;
  params?: object | unknown[] | Record<string, unknown>;
};
type WalletRpcProvider = {
  request: (...args: [WalletRequestArgs, string?, number?]) => Promise<unknown>;
  client?: Client;
  session?: SessionTypes.Struct;
};

interface WalletConnectContextValue {
  isInitializing: boolean;
  /** UniversalProvider 的 client，用于 relayer.restartTransport 等 */
  client: Client | undefined;
  session: SessionTypes.Struct | undefined;
  provider: WalletRpcProvider | undefined;
  accounts: string[];
  address: `0x${string}` | undefined;
  chainId: number | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  walletName: string | undefined;
  connect: (pairing?: { topic: string }) => Promise<void>;
  disconnect: () => Promise<void>;
  openModal: () => void;
  closeModal: () => void;
  isModalOpen: boolean;
}

const WalletConnectContext = createContext<WalletConnectContextValue | null>(null);

const projectId = process.env.NEXT_PUBLIC_WAGMI_PROJECT_ID as string || "64822f3f7973c800b39414924fbbd66a";
const metadata = {
  name: "Awkward Bear",
  description: "Awkward Bear Application",
  url: typeof window !== "undefined" ? window.location.origin : "http://localhost",
  icons: ["https://walletconnect.com/_next/static/media/logo_mark.b1f78d9b.svg"],
};

const customRpcUrls = {
  [BSC_CHAIN]: [{ url: BEAR_NFT.RPC || "https://bsc-dataseed.binance.org" }],
};

let appkit: AppKit | undefined;
let wagmiAdapter: WagmiAdapter | undefined;
let creatingProvider = false;

const MOBILE_UA_REGEXP =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

function isMobileBrowser() {
  return typeof navigator !== "undefined" && MOBILE_UA_REGEXP.test(navigator.userAgent);
}

function isTelegramWebView() {
  type TelegramWindow = Window & {
    TelegramWebviewProxy?: unknown;
    Telegram?: { WebApp?: { initData?: string } };
  };
  const telegramWindow = window as TelegramWindow;
  return (
    typeof window !== "undefined" &&
    (telegramWindow.TelegramWebviewProxy !== undefined || !!telegramWindow.Telegram?.WebApp?.initData)
  );
}

function toNumberChainId(chainId: unknown): number | undefined {
  if (typeof chainId === "number" && Number.isFinite(chainId)) return chainId;
  if (typeof chainId === "string") {
    if (chainId.startsWith("0x")) {
      const hex = Number.parseInt(chainId, 16);
      return Number.isFinite(hex) ? hex : undefined;
    }
    const dec = Number.parseInt(chainId, 10);
    return Number.isFinite(dec) ? dec : undefined;
  }
  return undefined;
}

function parseSessionAddress(_session: SessionTypes.Struct): `0x${string}` | undefined {
  const account = _session?.namespaces?.eip155?.accounts?.[0];
  if (!account) return undefined;
  const parts = account.split(":");
  return parts[parts.length - 1] as `0x${string}`;
}

function parseSessionChainId(_session: SessionTypes.Struct): number | undefined {
  const chain = _session?.namespaces?.eip155?.chains?.[0];
  if (!chain) return undefined;
  const [, id] = chain.split(":");
  const parsed = Number.parseInt(id || "0", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseChainIdFromCaipAddress(caipAddress: string | undefined): number | undefined {
  if (!caipAddress) return undefined;
  const [, id] = caipAddress.split(":");
  const parsed = Number.parseInt(id || "0", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function WalletConnectProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<WalletRpcProvider>();
  const [universalProvider, setUniversalProvider] = useState<IUniversalProvider>();
  const [session, setSession] = useState<SessionTypes.Struct>();
  const [accountAddress, setAccountAddress] = useState<`0x${string}`>();
  const [accountChainId, setAccountChainId] = useState<number>();
  const [accountWalletName, setAccountWalletName] = useState<string>();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const [mobileUri, setMobileUri] = useState<string>("");
  const [isMobileWalletModalOpen, setIsMobileWalletModalOpen] = useState(false);

  const initStarted = useRef(false);
  const appkitUnsubscribers = useRef<Array<() => void>>([]);

  const chains = useMemo(() => [BSC_CHAIN], []);

  const reset = useCallback(() => {
    setSession(undefined);
    setAccountAddress(undefined);
    setAccountChainId(undefined);
    setAccountWalletName(undefined);
    setProvider(universalProvider);
  }, [universalProvider]);

  const onSessionConnected = useCallback((_session: SessionTypes.Struct) => {
    setSession(_session);
    setProvider(universalProvider);
    setAccountAddress(parseSessionAddress(_session));
    setAccountChainId(parseSessionChainId(_session));
    setAccountWalletName(_session?.peer?.metadata?.name);
  }, [universalProvider]);

  const connect = useCallback(
    async (pairing?: { topic: string }) => {
      if (!universalProvider) {
        throw new Error("WalletConnect is not initialized");
      }
      setIsConnecting(true);

      const isMobile = isMobileBrowser();
      const isTelegram = isTelegramWebView();
      const shouldUseDesktopModal = !isMobile && !isTelegram;

      if (shouldUseDesktopModal) {
        try {
          await appkit?.open?.({ view: "Connect" });
          setIsModalOpen(true);
        } finally {
          setIsConnecting(false);
        }
        return;
      }

      try {
        const namespacesToRequest = getRequiredNamespaces(chains);

        if (isTelegram) {
          appkit?.open();
          setIsModalOpen(true);
        } else {
          // 普通移动端网页通过 display_uri 触发自定义深链弹窗
          setIsModalOpen(true);
        }

        const allCaipChains = Object.values(namespacesToRequest).flatMap(
          (ns: { chains?: string[] }) => ns.chains || [],
        );

        const authentication: ConnectParams["authentication"] | undefined = isTelegram
          ? [
              {
                uri: window.location.origin,
                domain: window.location.host,
                chains: allCaipChains,
                nonce: "1",
                ttl: 1000,
              },
            ]
          : undefined;

        (universalProvider as { namespaces?: unknown }).namespaces = undefined;
        const newSession = await universalProvider.connect({
          pairingTopic: pairing?.topic,
          optionalNamespaces: namespacesToRequest as NamespaceConfig,
          authentication,
        });

        if (!newSession) {
          throw new Error("Session is not connected");
        }

        await onSessionConnected(newSession);
      } catch (e) {
        console.error(e);
        toast.error((e as Error).message, { position: "bottom-left" });
        throw e;
      } finally {
        setIsConnecting(false);
        appkit?.close();
        setIsMobileWalletModalOpen(false);
        setIsModalOpen(false);
      }
    },
    [universalProvider, chains, onSessionConnected],
  );

  const disconnect = useCallback(async () => {
    try {
      try {
        await appkit?.disconnect();
      } catch {
        // ignore
      }
      const client = universalProvider?.client;
      if (client && session?.topic) {
        await client.disconnect({
          topic: session.topic,
          reason: getSdkError("USER_DISCONNECTED"),
        });
      }
      reset();
    } catch (error) {
      console.error("Disconnect error:", error);
      toast.error(`Failed to disconnect: ${(error as Error).message}`, {
        position: "bottom-left",
      });
      throw error;
    }
  }, [universalProvider, session, reset]);

  const openModal = useCallback(() => {
    appkit?.open({ view: "Connect" });
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    appkit?.close();
    setIsModalOpen(false);
  }, []);

  const accounts = useMemo(() => {
    if (session?.namespaces?.eip155?.accounts?.length) return session.namespaces.eip155.accounts;
    if (accountAddress) {
      return [`eip155:${accountChainId ?? BEAR_NFT.chainId}:${accountAddress}`];
    }
    return [];
  }, [session, accountAddress, accountChainId]);

  const address = useMemo((): `0x${string}` | undefined => {
    if (accountAddress) return accountAddress;
    const acc = accounts[0];
    if (!acc) return undefined;
    const parts = acc.split(":");
    return parts[parts.length - 1] as `0x${string}`;
  }, [accounts, accountAddress]);

  const chainId = useMemo(() => {
    if (accountChainId) return accountChainId;
    if (!session?.namespaces?.eip155?.chains?.length) return undefined;
    const caip = session.namespaces.eip155.chains[0];
    const [, id] = caip.split(":");
    return parseInt(id || "0", 10) || undefined;
  }, [session, accountChainId]);

  const walletName = useMemo(() => {
    return accountWalletName || session?.peer?.metadata?.name;
  }, [accountWalletName, session]);

  useEffect(() => {
    if (typeof window === "undefined" || initStarted.current) return;
    initStarted.current = true;

    (async () => {
      try {
        if (creatingProvider) return;
        creatingProvider = true;

        const nextUniversalProvider = await UniversalProvider.init({
          projectId,
          metadata: {
            name: metadata.name,
            description: metadata.description,
            url: metadata.url,
            icons: metadata.icons,
          },
        });

        const isMobile = isMobileBrowser();
        const isTelegram = isTelegramWebView();

        if (!isTelegram && isMobile) {
          nextUniversalProvider.on("display_uri", (uri: string) => {
            console.log("display_uri emitted:", uri);
            setMobileUri(uri);
            setIsMobileWalletModalOpen(true);
          });
        }

        const networks = [bsc];
        if (!appkit) {
          if (!wagmiAdapter) {
            wagmiAdapter = new WagmiAdapter({
              projectId,
              networks,
              ssr: true,
              customRpcUrls,
            });
          }

          if (isTelegram) {
            await wagmiAdapter.setUniversalProvider(nextUniversalProvider);
          }

          appkit = createAppKit({
            adapters: [wagmiAdapter],
            projectId,
            networks: networks as [typeof bsc, ...(typeof bsc)[]],
            metadata,
            showWallets: true,
            manualWCControl: Boolean(isMobile && !isTelegram),
            universalProvider: isTelegram ? (nextUniversalProvider as never) : undefined,
            defaultNetwork: bsc,
            themeMode: "light",
            features: {
              analytics: false,
              email: false,
              socials: [],
            },
            enableEIP6963: !isMobile && !isTelegram,
            enableInjected: !isMobile && !isTelegram,
            enableWalletConnect: true,
            enableCoinbase: false,
            allowUnsupportedChain: true,
            customRpcUrls,
            includeWalletIds: [
              "c36b25db7e48aa7ca19acbae35f79d6486b694f4d12def467592daa78c4cd5b7",
              "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96",
              "971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709",
              "8a0ee50d1f22f6651afcae7eb4253e52a3310b90af5daef78a8c4929a9bb99d4",
            ],
            featuredWalletIds: [
              "c36b25db7e48aa7ca19acbae35f79d6486b694f4d12def467592daa78c4cd5b7",
              "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96",
              "971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709",
              "8a0ee50d1f22f6651afcae7eb4253e52a3310b90af5daef78a8c4929a9bb99d4",
            ],
          });
        }

        setUniversalProvider(nextUniversalProvider);
        setProvider(nextUniversalProvider);

        const client = nextUniversalProvider.client;
        if (client?.session?.length) {
          const lastKey = client.session.keys[client.session.keys.length - 1];
          const existingSession = client.session.get(lastKey);
          if (existingSession) {
            await onSessionConnected(existingSession);
          }
        }

        const sessionEventClient = client as unknown as {
          on?: (event: string, listener: (payload: unknown) => void) => void;
        };
        sessionEventClient.on?.("session_connect", (payload) => {
          const nextSession = (payload as { session?: SessionTypes.Struct })?.session;
          if (nextSession) onSessionConnected(nextSession);
        });
        client?.on?.("session_update", ({ topic, params }) => {
          console.log("[WC][event] session_update");
          const { namespaces } = params;
          const s = client.session.get(topic);
          if (s) onSessionConnected({ ...s, namespaces });
        });
        client?.on?.("session_delete", () => {
          reset();
        });

        if (appkit) {
          appkitUnsubscribers.current.forEach((unsubscribe) => unsubscribe());
          appkitUnsubscribers.current = [
            appkit.subscribeState((state) => {
              setIsModalOpen(Boolean(state?.open));
            }),
            appkit.subscribeAccount((state) => {
              const connected = Boolean(state?.isConnected && state?.address);
              if (!connected) {
                setAccountAddress(undefined);
                setAccountChainId(undefined);
                setAccountWalletName(undefined);
                setProvider(nextUniversalProvider);
                return;
              }
              const nextWalletProvider = appkit?.getWalletProvider() as WalletRpcProvider | undefined;
              const nextWalletInfo = appkit?.getWalletInfo("eip155");
              setProvider(nextWalletProvider ?? nextUniversalProvider);
              setSession(undefined);
              setAccountAddress(state?.address as `0x${string}`);
              setAccountChainId(
                toNumberChainId(parseChainIdFromCaipAddress(state?.caipAddress)),
              );
              setAccountWalletName(nextWalletInfo?.name);
            }, "eip155"),
            appkit.subscribeWalletInfo((walletInfo) => {
              if (walletInfo?.name) {
                setAccountWalletName(walletInfo.name);
              }
            }, "eip155"),
          ];
        }
      } catch (err) {
        console.error("[WalletConnectContext] init failed", err);
      } finally {
        creatingProvider = false;
        setIsInitializing(false);
      }
    })();
    return () => {
      appkitUnsubscribers.current.forEach((unsubscribe) => unsubscribe());
      appkitUnsubscribers.current = [];
    };
  }, [onSessionConnected, reset]);

  const value = useMemo(
    (): WalletConnectContextValue => ({
      isInitializing,
      client: universalProvider?.client || provider?.client,
      session,
      provider,
      accounts,
      address,
      chainId,
      isConnected: Boolean(address),
      isConnecting,
      walletName,
      connect,
      disconnect,
      openModal,
      closeModal,
      isModalOpen,
    }),
    [
      isInitializing,
      universalProvider,
      provider,
      session,
      accounts,
      address,
      chainId,
      isConnecting,
      walletName,
      connect,
      disconnect,
      openModal,
      closeModal,
      isModalOpen,
    ],
  );

  return (
    <WalletConnectContext.Provider value={value}>
      {children}
      <MobileWalletModal
        open={isMobileWalletModalOpen}
        onOpenChange={setIsMobileWalletModalOpen}
        uri={mobileUri}
      />
    </WalletConnectContext.Provider>
  );
}

export function useWalletConnect() {
  const ctx = useContext(WalletConnectContext);
  if (!ctx) {
    throw new Error("useWalletConnect must be used within WalletConnectProvider");
  }
  return ctx;
}
