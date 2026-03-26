"use client";

import { Button } from "@/components/ui/button";
import { useWalletConnect } from "@/contexts/WalletConnectContext";
import { UniversalProviderContext } from "@/providers/Web3Provider";
import { user } from "@/services";
import { auth, UserMeResponse, WalletType } from "@/services/auth";
import { clearTokenPair, getAccessToken, getRefreshToken } from "@/services/token";
import {
  clearTelegramXBridgeAccessToken,
  clearTelegramXReturnState,
  getTelegramMainMiniAppDeepLink,
  getTelegramMainMiniAppLink,
  getTelegramXBridgeAccessToken,
  returnToTelegramMiniApp,
  shouldReturnToTelegramMiniApp,
} from "@/utils/telegramLink";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTelegram } from "./TelegramProvider";

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function attemptedKey(address: string): string {
  return `abpet:wallet-login-attempted:${address.toLowerCase()}`;
}

function hasAttempted(address: string): boolean {
  if (!canUseSessionStorage()) return false;
  return window.sessionStorage.getItem(attemptedKey(address)) === "1";
}

function markAttempted(address: string): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(attemptedKey(address), "1");
}

function removeAttempted(address: string): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(attemptedKey(address));
}

function walletNameToWalletType(walletName: string | undefined): WalletType {
  console.log("walletName:", walletName);

  if (!walletName) return "Wallet_Connect";
  const name = walletName.toLowerCase();
  if (name.includes("metamask")) return "Meta_Mask";
  if (name.includes("ab pay") || name.includes("abpay") || name.includes("abwallet"))
    return "AB_Wallet";
  if (name.includes("coinbase")) return "Coinbase_Wallet";
  if (name.includes("phantom")) return "Phantom";
  if (name.includes("binance")) return "Binance_Wallet";
  if (name.includes("okx")) return "OKX_Wallet";
  return "Wallet_Connect";
}

const getDefaultUserMeResponse = (): UserMeResponse => ({
  id: "",
  username: "",
  photoUrl: "",
  email: "",
  mobile: "",
  xid: "",
  walletAddress: "",
  walletType: "Unknown",
  totalPoints: 0,
  inviteCode: "",
  invitePoints: 0,
  petPoints: 0,
  taskPoints: 0,
  activeStatus: null,
});

export const ABUserContext = createContext<
  | (UserMeResponse & {
      updateUserInfo: () => void;
      clearUserInfo: () => void;
      isWalletLoggingIn?: boolean;
    })
  | undefined
>(undefined);

export const getInviteCode = () => {
  let inviteCode = "";
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    inviteCode = urlParams.get("inviteCode") || "";
  }
  return inviteCode;
};

export function WalletAuthSync({ children }: { children: React.ReactNode }) {
  const { address, isConnected, closeModal, isModalOpen, walletName } = useWalletConnect();
  const wcClient = useContext(UniversalProviderContext);

  const [abUser, setAbUser] = useState<UserMeResponse>(getDefaultUserMeResponse());
  const { user: tgUser } = useTelegram();
  const loginTriggeredForAddressRef = useRef<string | null>(null);
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const t = useTranslations("common");

  const [isWalletLoggingIn, setIsWalletLoggingIn] = useState(false);
  const [showTelegramReturnPrompt, setShowTelegramReturnPrompt] = useState(false);
  const [pendingTelegramAutoReturn, setPendingTelegramAutoReturn] = useState(false);

  const scheduleTelegramReturn = useCallback(
    (shouldReturn: boolean, reason: "success" | "failure") => {
      if (!shouldReturn) {
        return;
      }

      setShowTelegramReturnPrompt(true);
      setPendingTelegramAutoReturn(true);
    },
    [],
  );

  const clearUserInfo = () => {
    setAbUser(getDefaultUserMeResponse());
  };

  const telegramDeepLink = getTelegramMainMiniAppDeepLink();
  const telegramFallbackLink = getTelegramMainMiniAppLink();

  const updateUserInfo = useCallback(() => {
    if (!address) return;
    user.me().then((res) => {
      const data = res.data || getDefaultUserMeResponse();
      const userWalletAddress = data.walletAddress;
      if (
        address &&
        userWalletAddress &&
        userWalletAddress.toLowerCase() !== address.toLowerCase()
      ) {
        auth.logout().then(() => {
          clearTokenPair();
          clearUserInfo();
          toast.error(t("walletMismatch"));
        });
        return;
      }
      setAbUser(data);
    });
  }, [address, t]);

  useEffect(() => {
    if (isConnected && address && isModalOpen) {
      closeModal();
    }
  }, [isConnected, address, isModalOpen, closeModal]);

  useEffect(() => {
    if (!wcClient?.client?.core?.relayer) return;
    const relayer = wcClient.client.core.relayer;
    const sync = () => {
      if (document.visibilityState === "visible" && relayer?.restartTransport) {
        // @ts-ignore
        if (!relayer.connected) {
          relayer.restartTransport().catch(() => {});
        }
      }
    };
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    window.addEventListener("pageshow", () => {
      // @ts-ignore
      if (relayer?.restartTransport && !relayer.connected) {
        relayer.restartTransport().catch(() => {});
      }
    });
    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
    };
  }, [wcClient]);

  useEffect(() => {
    if (status === "authenticated" && session) {
      const twitterId = session.user?.id;
      const twitterUsername = session.user?.name;
      const image = session.user?.image;
      const twitterConnectFlag = localStorage.getItem("twitter_connect_flag");
      const url = new URL(window.location.href);
      const isTwitterConnectCallback = url.searchParams.get("auth") === "twitter";
      const isTelegramReturnCallback = shouldReturnToTelegramMiniApp();
      const bridgeAccessToken = getTelegramXBridgeAccessToken();
      const linkAccessToken = bridgeAccessToken || getAccessToken();
      const utmSource = url.searchParams.get("utmSource") || "";
      const utmMedium = url.searchParams.get("utmMedium") || "";
      if (
        twitterId &&
        linkAccessToken &&
        (!abUser?.xid || abUser?.xid.toLowerCase() !== twitterId.toLowerCase()) &&
        (twitterConnectFlag || isTwitterConnectCallback || isTelegramReturnCallback)
      ) {
        auth
          .linkX(
            {
              id: twitterId,
              username: twitterUsername || "",
              photoUrl: image || "",
              inviteCode: getInviteCode(),
              tgId: tgUser?.userId || "",
              utmSource,
              utmMedium,
            },
            linkAccessToken,
          )
          .then((res) => {
            toast.success(t("xLinkSuccess"));
            const data = res.data;
            if (data?.petInfo) delete data?.petInfo;
            setAbUser(data);
            localStorage.removeItem("twitter_connect_flag");
            clearTelegramXBridgeAccessToken();
            clearTelegramXReturnState();

            scheduleTelegramReturn(isTelegramReturnCallback, "success");
          })
          .catch((error) => {
            console.error("[WalletAuthSync] linkX failed");
            toast.error(t("xLinkFailed"));
            localStorage.removeItem("twitter_connect_flag");
            clearTelegramXBridgeAccessToken();
            clearTelegramXReturnState();
            scheduleTelegramReturn(isTelegramReturnCallback, "failure");
          });
      }
    }
  }, [abUser?.xid, scheduleTelegramReturn, session, status, tgUser?.userId, t]);

  useEffect(() => {
    if (!showTelegramReturnPrompt || !pendingTelegramAutoReturn) {
      return;
    }

    const timer = window.setTimeout(() => {
      returnToTelegramMiniApp();
      setPendingTelegramAutoReturn(false);
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [pendingTelegramAutoReturn, showTelegramReturnPrompt, telegramDeepLink, telegramFallbackLink]);

  useEffect(() => {
    if (pathname?.includes("/profile")) {
      updateUserInfo();
    }
  }, [pathname, updateUserInfo]);

  useEffect(() => {
    if (!isConnected || !address) {
      loginTriggeredForAddressRef.current = null;
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();
      if (accessToken && refreshToken) {
        updateUserInfo();
        return;
      }
      setAbUser(getDefaultUserMeResponse());
      return;
    }

    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    if (accessToken && refreshToken) {
      updateUserInfo();
      return;
    }

    if (loginTriggeredForAddressRef.current === address) return;
    loginTriggeredForAddressRef.current = address;

    const walletType = walletNameToWalletType(walletName);
    setIsWalletLoggingIn(true);

    auth
      .loginWithWallet({
        address,
        walletType,
        inviteCode: getInviteCode(),
        tgId: tgUser?.userId || "",
        utmSource: new URL(window.location.href).searchParams.get("utmSource") || "",
        utmMedium: new URL(window.location.href).searchParams.get("utmMedium") || "",
      })
      .then((res) => {
        if (res?.data?.userInfo) setAbUser(res.data.userInfo);
      })
      .catch(() => {
        loginTriggeredForAddressRef.current = null;
        toast.error(t("walletLoginFailed"));
      })
      .finally(() => {
        setIsWalletLoggingIn(false);
      });
  }, [isConnected, address, tgUser?.userId, t, updateUserInfo, walletName]);

  return (
    <ABUserContext.Provider value={{ ...abUser, updateUserInfo, clearUserInfo, isWalletLoggingIn }}>
      {children}
      {showTelegramReturnPrompt ? (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-900">{t("telegramReturnTitle")}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{t("telegramReturnDesc")}</p>
            <div className="mt-6 flex flex-col gap-3">
              <Button asChild className="h-11 rounded-xl text-sm font-semibold">
                <a href={telegramDeepLink}>{t("openTelegramApp")}</a>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-xl text-sm font-semibold">
                <a href={telegramFallbackLink}>{t("openTelegramFallback")}</a>
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-10 rounded-xl text-sm text-slate-500"
                onClick={() => {
                  setPendingTelegramAutoReturn(false);
                  setShowTelegramReturnPrompt(false);
                }}
              >
                {t("stayInBrowser")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </ABUserContext.Provider>
  );
}
