"use client";

import { colors } from "@/assets/color";
import ABWalletBoostZh from "@/assets/icon/header-ab-wallet-boost-zh.png";
import ABWalletBoost from "@/assets/icon/header-ab-wallet-boost.png";
import headerLanguage from "@/assets/icon/header-language.png";
import headerUser from "@/assets/icon/header-user.png";
import { useWalletConnect } from "@/contexts/WalletConnectContext";
import { usePathname, useRouter } from "@/i18n/routing";
import { ABUserContext } from "@/providers/WalletAuthSync";
import { auth, clearTokenPair } from "@/services";
import { useIsZh } from "@/utils/i18n";
import { truncateString } from "@/utils/string";
import {
  getTelegramTwitterAuthStartUrl,
  isTelegramMobileWebView,
  isTelegramWebView,
  markTelegramXReturn,
  openOAuthLinkOutsideTelegram,
} from "@/utils/telegramLink";
import { signIn, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { useContext, useState } from "react";
import ConnectWalletGuideSheetContent from "./ConnectWalletGuideSheetContent";
import ConnectXGuideDialog from "./ConnectXGuideDialog";
import { Dialog } from "./ui/dialog";
import { Sheet } from "./ui/sheet";

export default function Header() {
  const t = useTranslations("Header");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const { address: connectedAddress, isConnected, disconnect, connect } = useWalletConnect();
  const currentLocale = params.locale as string;
  const [openConnectWalletGuideSheet, setOpenConnectWalletGuideSheet] = useState(false);
  const [openConnectXGuideDialog, setOpenConnectXGuideDialog] = useState(false);
  const handleLanguageChange = (newLocale: string) => {
    const queryString = searchParams?.toString() || "";
    const href = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(href, { locale: newLocale });
  };
  const abUserInfo = useContext(ABUserContext);
  const connected = isConnected;
  const isZh = useIsZh();
  const handleConnectX = () => {
    if (!abUserInfo?.id) {
      setOpenConnectWalletGuideSheet(true);
      return;
    }

    // 在本地存一个标识，避免重复认证
    localStorage.setItem("twitter_connect_flag", "true");
    setOpenConnectXGuideDialog(false);
    const url = new URL(window.location.href);
    url.searchParams.set("auth", "twitter");

    if (isTelegramMobileWebView()) {
      markTelegramXReturn(url);
      openOAuthLinkOutsideTelegram(getTelegramTwitterAuthStartUrl(url));
    } else if (isTelegramWebView()) {
      signIn("twitter", {
        callbackUrl: url.pathname + url.search,
        redirect: false,
      }).then((res) => {
        if (res?.url) {
          window.location.href = res.url;
        }
      });
    } else {
      signIn("twitter", {
        callbackUrl: url.pathname + url.search,
      });
    }
  };

  const handleDisconnectClick = async () => {
    // 清除 NextAuth 会话（推特缓存）
    // signOut 会调用 /bff/auth/signout endpoint 清除 Cookie
    try {
      await signOut({
        redirect: false,
      });
    } catch (error) {
      console.error("Failed to sign out:", error);
    }

    // 清除 sessionStorage 中所有推特相关的标记
    if (typeof window !== "undefined" && window.sessionStorage) {
      // 清除所有 abpet:x-login-synced:* 键
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (
          key &&
          (key.startsWith("abpet:x-login-synced:") ||
            key.startsWith("abpet:wallet-login-attempted:"))
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => {
        window.sessionStorage.removeItem(key);
      });
    }

    // 清除 NextAuth 相关的 Cookie（如果 signOut 没有完全清除）
    if (typeof document !== "undefined" && typeof window !== "undefined") {
      // 清除所有 NextAuth 相关的 Cookie
      const cookiesToClear = [
        "next-auth.session-token",
        "__Secure-next-auth.session-token",
        "next-auth.csrf-token",
        "__Secure-next-auth.csrf-token",
        "next-auth.callback-url",
        "__Secure-next-auth.callback-url",
      ];
      const hostname = window.location.hostname;
      cookiesToClear.forEach((cookieName) => {
        // 清除当前路径的 Cookie
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        // 清除带域名的 Cookie（仅当不是 localhost 时）
        if (hostname !== "localhost" && hostname !== "127.0.0.1") {
          // 清除带 . 前缀的域名 Cookie
          if (hostname.includes(".")) {
            const domain = "." + hostname.split(".").slice(-2).join(".");
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
          }
        }
      });
    }

    // 然后清除其他状态
    await auth.logout().catch();
    clearTokenPair();
    abUserInfo?.clearUserInfo();
    await disconnect();
    setOpenConnectWalletGuideSheet(true);
  };

  return (
    <div
      className="w-full flex items-center justify-between px-4 py-2 rounded-b-2xl h-[56px] relative z-9"
      style={{
        backgroundColor: colors.cyan200,
        borderBottom: `2px solid ${colors.cyan950}`,
      }}
    >
      {/* Guest Profile */}
      <div
        className="flex items-center"
        onClick={() => {
          if (!abUserInfo?.id) {
            setOpenConnectWalletGuideSheet(true);
            return;
          }
          if (!abUserInfo?.xid) {
            setOpenConnectXGuideDialog(true);
          }
        }}
      >
        <Image
          src={abUserInfo?.photoUrl || headerUser}
          alt="guest profile"
          width={24}
          height={24}
          className="rounded-full"
          unoptimized
        />
        <span className="ml-1 font-bold text-sm text-cyan-950">
          {abUserInfo?.id
            ? ((abUserInfo?.username && truncateString(abUserInfo?.username, 4, 4)) ??
              `User-${truncateString(abUserInfo?.walletAddress, 4, 4)}`)
            : "Guest"}
        </span>
      </div>

      <div className="flex">
        {/* 一个特殊情况：有 userId，但钱包未连接，此时空间不够这块隐藏 */}
        {abUserInfo?.id && !(connected && connectedAddress) ? null : (
          <>
            {/* AB Wallet boost */}
            {abUserInfo?.id && abUserInfo?.walletType !== "AB_Wallet" && (
              <div className="mr-2 flex items-center">
                <Image
                  src={isZh ? ABWalletBoostZh : ABWalletBoost}
                  alt="AB Wallet boost"
                  width={136}
                  onClick={handleDisconnectClick}
                />
              </div>
            )}
            {/* Language Selector */}

            <button
              onClick={() => handleLanguageChange(currentLocale === "en" ? "zh" : "en")}
              className="flex items-center p-2 rounded-full"
              style={{
                background: colors.cyan50,
                border: `2px solid ${colors.cyan950}`,
              }}
            >
              <Image src={headerLanguage} alt="language" width={14} height={14} />
              <span className="text-xs ml-1 text-cyan-950">{currentLocale.toUpperCase()}</span>
            </button>
          </>
        )}

        {/* Connect Wallet Button：先打开引导页，再进入 AppKit 选钱包 */}
        <div>
          {connected && connectedAddress ? null : (
            <>
              <button
                type="button"
                onClick={() => setOpenConnectWalletGuideSheet(true)}
                className="font-baloo px-3 py-2 rounded-full font-bold text-base ml-4 h-[36px] flex items-center"
                style={{
                  background: colors.cyan400,
                  border: `1px solid ${colors.cyan950}`,
                  boxShadow: `2px 2px 0px 0px ${colors.cyan950}`,
                  color: colors.cyan950,
                  fontFamily: "var(--font-baloo)",
                }}
              >
                {t("connectWallet")}
              </button>
              <Sheet
                open={openConnectWalletGuideSheet}
                onOpenChange={setOpenConnectWalletGuideSheet}
              >
                <ConnectWalletGuideSheetContent
                  handleClickConnectWallet={() => {
                    setOpenConnectWalletGuideSheet(false);
                    connect?.();
                  }}
                />
              </Sheet>
            </>
          )}
        </div>
      </div>

      <Dialog open={openConnectXGuideDialog} onOpenChange={setOpenConnectXGuideDialog}>
        <ConnectXGuideDialog
          handleCancel={() => setOpenConnectXGuideDialog(false)}
          handleClose={() => setOpenConnectXGuideDialog(false)}
          handleConnect={handleConnectX}
        />
      </Dialog>
    </div>
  );
}
