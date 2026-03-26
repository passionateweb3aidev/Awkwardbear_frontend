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

interface WalletConnectContextValue {
  isInitializing: boolean;
  /** UniversalProvider 的 client，用于 relayer.restartTransport 等 */
  client: Client | undefined;
  session: SessionTypes.Struct | undefined;
  provider: IUniversalProvider | undefined;
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

export function WalletConnectProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<IUniversalProvider>();
  const [session, setSession] = useState<SessionTypes.Struct>();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const [mobileUri, setMobileUri] = useState<string>("");
  const [isMobileWalletModalOpen, setIsMobileWalletModalOpen] = useState(false);

  const initStarted = useRef(false);

  const chains = useMemo(() => [BSC_CHAIN], []);

  const reset = useCallback(() => {
    setSession(undefined);
  }, []);

  const onSessionConnected = useCallback((_session: SessionTypes.Struct) => {
    setSession(_session);
  }, []);

  const connect = useCallback(
    async (pairing?: { topic: string }) => {
      if (!provider) {
        throw new Error("WalletConnect is not initialized");
      }
      setIsConnecting(true);
      let shouldAutoCloseModal = true;
      try {
        const namespacesToRequest = getRequiredNamespaces(chains);

        const isMobile =
          typeof navigator !== "undefined" &&
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent,
          );
        const isTelegram =
          typeof window !== "undefined" &&
          ((window as any).TelegramWebviewProxy !== undefined ||
            !!(window as any).Telegram?.WebApp?.initData);

        // PC 端：打开 Connect 视图（钱包卡片列表），并且不要手动 provider.connect()
        // 否则会立刻触发 display_uri -> 直接跳通用二维码页
        if (!isMobile) {
          shouldAutoCloseModal = false;
          appkit?.open?.({ view: "Connect" } as any);
          setIsModalOpen(true);
          // PC 端也订阅 open 状态，方便外部（WalletAuthSync）在连上后关闭
          appkit?.subscribeState?.((state: { open: boolean }) => {
            setIsModalOpen(!!state?.open);
          });
          return;
        }

        // 仅对 Telegram 使用 AppKit 原有的手动逻辑
        if (isTelegram) {
          appkit?.open();
          setIsModalOpen(true);

          appkit?.subscribeState?.((state: { open: boolean }) => {
            setIsModalOpen(!!state?.open);
            if (!state?.open && !provider.session) {
              throw new Error("Connection request reset. Please try again.");
            }
          });
        } else {
          // iOS / Android 普通网页使用自定义的 Modal，由 display_uri 监听器触发！
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

        (provider as { namespaces?: unknown }).namespaces = undefined;
        const newSession = await provider.connect({
          pairingTopic: pairing?.topic,
          optionalNamespaces: namespacesToRequest as NamespaceConfig,
          authentication, // 避免 iOS 和 Android 外部环境 URI 过长！
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
        if (shouldAutoCloseModal) {
          appkit?.close();
          setIsMobileWalletModalOpen(false);
          setIsModalOpen(false);
        }
      }
    },
    [provider, chains, onSessionConnected],
  );

  const disconnect = useCallback(async () => {
    const client = provider?.client;
    if (!client) {
      reset();
      return;
    }
    if (!session) {
      reset();
      return;
    }
    try {
      await client.disconnect({
        topic: session.topic,
        reason: getSdkError("USER_DISCONNECTED"),
      });
      // 对开启了防注入与 AppKit 管理的 PC 端，也要调用内置的断开方法以清理内部状态（特别是 MetaMask 缓存状态）
      try {
        await appkit?.disconnect();
      } catch {
        // ignore
      }
      reset();
    } catch (error) {
      console.error("Disconnect error:", error);
      toast.error(`Failed to disconnect: ${(error as Error).message}`, {
        position: "bottom-left",
      });
      throw error;
    }
  }, [provider, session, reset]);

  const openModal = useCallback(() => {
    appkit?.open();
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    appkit?.close();
    setIsModalOpen(false);
  }, []);

  const accounts = useMemo(() => {
    if (!session?.namespaces?.eip155?.accounts?.length) return [];
    return session.namespaces.eip155.accounts;
  }, [session]);

  const address = useMemo((): `0x${string}` | undefined => {
    const acc = accounts[0];
    if (!acc) return undefined;
    const parts = acc.split(":");
    return parts[parts.length - 1] as `0x${string}`;
  }, [accounts]);

  const chainId = useMemo(() => {
    if (!session?.namespaces?.eip155?.chains?.length) return undefined;
    const caip = session.namespaces.eip155.chains[0];
    const [, id] = caip.split(":");
    return parseInt(id || "0", 10) || undefined;
  }, [session]);

  const walletName = useMemo(() => {
    return session?.peer?.metadata?.name;
  }, [session]);

  useEffect(() => {
    if (typeof window === "undefined" || initStarted.current) return;
    initStarted.current = true;

    (async () => {
      try {
        if (creatingProvider) return;
        creatingProvider = true;

        const universalProvider = await UniversalProvider.init({
          projectId,
          metadata: {
            name: metadata.name,
            description: metadata.description,
            url: metadata.url,
            icons: metadata.icons,
          },
        });

        const isMobile =
          typeof navigator !== "undefined" &&
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent,
          );

        const isTelegram =
          typeof window !== "undefined" &&
          ((window as any).TelegramWebviewProxy !== undefined ||
            !!(window as any).Telegram?.WebApp?.initData);

        if (!isTelegram && isMobile) {
          // listen for display_uri
          universalProvider.on("display_uri", (uri: string) => {
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

          // 关键：为了不影响普通移动端浏览器（能正常拦截 display_uri 唤起原生钱包），
          // 我们这里“仅在” Telegram 或 PC 环境下，执行不常规的 Provider 注入双重绑定操作。
          if (isTelegram || !isMobile) {
            await wagmiAdapter.setUniversalProvider(universalProvider as any);
          }

          appkit = createAppKit({
            adapters: [wagmiAdapter],
            projectId,
            networks: networks as [typeof bsc, ...(typeof bsc)[]],
            metadata,
            // 关键：让 PC 端先展示钱包卡片列表（否则会直接进入二维码流程）
            showWallets: true,
            // 仅移动端开启 manualWCControl（二维码），PC 端关闭以先展示 4 个钱包卡片
            manualWCControl: Boolean(isMobile),
            universalProvider: isTelegram || !isMobile ? (universalProvider as never) : undefined,
            defaultNetwork: bsc,
            themeMode: "light",
            features: {
              analytics: false,
              email: false,
              socials: [],
            },
            enableEIP6963: !isMobile && !isTelegram,
            enableInjected: !isMobile && !isTelegram,
            enableWalletConnect: isMobile || isTelegram,
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

        setProvider(universalProvider);

        const client = universalProvider.client;
        // 首次建立 session 时，PC 端可能不会触发 session_update，需要额外监听 session_connect
        try {
          (client as any)?.on?.("session_connect", (args: any) => {
            const nextSession = args?.session;
            if (nextSession) onSessionConnected(nextSession);
          });
        } catch {
          // ignore
        }
        if (client?.session?.length) {
          const lastKey = client.session.keys[client.session.keys.length - 1];
          const existingSession = client.session.get(lastKey);
          if (existingSession) {
            await onSessionConnected(existingSession);
          }
        }

        client?.on?.("session_event", () => {});
        try {
          (client as any)?.on?.("session_connect", (args: any) => {
            console.log("[WC][event] session_connect");
            const nextSession = args?.session;
            if (nextSession) onSessionConnected(nextSession);
          });
        } catch {
          // ignore
        }
        client?.on?.("session_update", ({ topic, params }) => {
          console.log("[WC][event] session_update");
          const { namespaces } = params;
          const s = client.session.get(topic);
          if (s) onSessionConnected({ ...s, namespaces });
        });
        client?.on?.("session_delete", () => {
          reset();
        });
      } catch (err) {
        console.error("[WalletConnectContext] init failed", err);
      } finally {
        creatingProvider = false;
        setIsInitializing(false);
      }
    })();
  }, [onSessionConnected, reset]);

  // 在 PC 端通过操作 DOM 强行隐藏 Web3Modal 首层的 WalletConnect 选项，保留其内在机制应对其他钱包扫码回退
  useEffect(() => {
    const isMobile =
      typeof navigator !== "undefined" &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTelegram =
      typeof window !== "undefined" &&
      ((window as any).TelegramWebviewProxy !== undefined ||
        !!(window as any).Telegram?.WebApp?.initData);

    // 仅在 PC 浏览器且弹窗打开时运行
    if (isMobile || isTelegram || !isModalOpen) return;

    let timer: NodeJS.Timeout;
    const hideWalletConnectItem = () => {
      try {
        const modal = document.querySelector("w3m-modal");
        const router = modal?.shadowRoot?.querySelector("w3m-router");
        const connectView = router?.shadowRoot?.querySelector("w3m-connect-view");
        const walletLoginList = connectView?.shadowRoot?.querySelector("w3m-wallet-login-list");
        const connectorList = walletLoginList?.shadowRoot?.querySelector("w3m-connector-list");

        if (connectorList?.shadowRoot) {
          const items = connectorList.shadowRoot.querySelectorAll("w3m-list-wallet");
          items.forEach((item: any) => {
            if (item.getAttribute("name") === "WalletConnect") {
              item.style.display = "none";
            }
          });
        }
      } catch (err) {
        // ignore
      }
      // 继续轮询，防止由于视图切换重新渲染出来
      timer = setTimeout(hideWalletConnectItem, 100);
    };

    hideWalletConnectItem();

    return () => clearTimeout(timer);
  }, [isModalOpen]);

  const value = useMemo(
    (): WalletConnectContextValue => ({
      isInitializing,
      client: provider?.client,
      session,
      provider,
      accounts,
      address,
      chainId,
      isConnected: !!session && accounts.length > 0,
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
