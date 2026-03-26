"use client";

import { colors } from "@/assets/color";
import commonInfoActive from "@/assets/icon/common-info-active.png";
import commonInfo from "@/assets/icon/common-info.png";
import copy from "@/assets/icon/copy.png";
import headerUser from "@/assets/icon/header-user.png";
import petHead from "@/assets/icon/home-pet-head.png";
import arrowRight from "@/assets/icon/profile-arrow-right.png";
import ConnectWalletGuideSheetContent from "@/components/ConnectWalletGuideSheetContent";
import Header from "@/components/Header";
import { Sheet } from "@/components/ui/sheet";
import { useRouter } from "@/i18n/routing";
import { ABUserContext } from "@/providers/WalletAuthSync";
import { auth, clearTokenPair } from "@/services";
import { pet, PetResponse } from "@/services/pet";
import { truncateString } from "@/utils/string";
import { useWalletConnect } from "@/contexts/WalletConnectContext";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import profileConst from "./const";

export default function Profile() {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const abUserInfo = useContext(ABUserContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address, isConnected, disconnect, connect } = useWalletConnect();
  const [openConnectWalletGuideSheet, setOpenConnectWalletGuideSheet] = useState(false);
  const handleHistoryClick = (activeTab?: string) => {
    const queryString = searchParams?.toString() || "";
    const href = queryString
      ? `/profile/history?${queryString}&activeTab=${activeTab}`
      : `/profile/history?activeTab=${activeTab}`;
    router.push(href);
  };
  const [petInfo, setPetInfo] = useState<PetResponse | null>(null);
  const prevUserIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const currentUserId = abUserInfo?.id;
    const prevId = prevUserIdRef.current;

    if (!currentUserId) {
      prevUserIdRef.current = currentUserId;
      queueMicrotask(() => {
        setPetInfo(null);
      });
      return;
    }

    if (currentUserId === prevId && prevId !== undefined) {
      console.warn(
        "[Profile useEffect] ⚠️ id 未变化但 effect 被触发！可能是 React StrictMode 或组件重新挂载导致",
      );
      return;
    }

    prevUserIdRef.current = currentUserId;
    const getUserPetInfo = async () => {
      const { data } = await pet.get().catch(() => {
        return { data: null };
      });
      setPetInfo(data);
    };
    getUserPetInfo();
  }, [abUserInfo?.id, petInfo]);

  const handleDisconnectClick = async () => {
    // 优先断开 Web3 钱包连接，强制等待其清理完成
    try {
      await disconnect();
    } catch (e) {
      console.warn("Wallet disconnect failed or already disconnected", e);
    }

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
  };

  return (
    <div
      className={`min-h-screen font-quicksand transition-transform duration-[${profileConst.ANIMATION_DURATION}ms] ease-in-out`}
      // style={{
      //   backgroundImage: `url(${backgroundImage.src})`,
      //   backgroundSize: "100% auto",
      //   backgroundRepeat: "repeat",
      //   fontFamily: "var(--font-quicksand)",
      // }}
    >
      <Header />
      <main className="relative px-4 mt-6">
        <div
          className="rounded-[16px] bg-cyan-200 border border-cyan-950 overflow-hidden"
          style={{
            boxShadow: `2px 2px 0px 0px ${colors.cyan950}`,
          }}
        >
          <div className="flex flex-col p-4">
            <p className="font-semibold text-cyan-800 text-xs">{t("myAccount")}</p>
            <div className="flex justify-between mt-2">
              <div className="flex items-center gap-2">
                <div className="border-2 border-cyan-500 rounded-full w-[40px] h-[40px] overflow-hidden">
                  <Image
                    src={abUserInfo?.photoUrl || headerUser}
                    alt="avatar"
                    width={36}
                    height={36}
                    className="w-[36px] h-[36px] rounded-full"
                    unoptimized
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <span
                      className="font-baloo font-bold text-sm text-cyan-800"
                      style={{
                        fontFamily: "var(--font-baloo)",
                      }}
                    >
                      {abUserInfo?.id
                        ? truncateString(
                            abUserInfo?.username ||
                              `@User${abUserInfo?.walletAddress || "unknown"}`,
                            4,
                            4,
                          )
                        : "Guest"}
                    </span>
                    {/* <span className="ml-1 flex items-center justify-center px-1 py-[2px] h-[16px] bg-cyan-950 text-cyan-300 rounded-[2px] text-[10px] font-bold">
                      Lv.11
                    </span> */}
                  </div>

                  {abUserInfo?.id && (
                    <div
                      className="flex items-center h-[20px] mt-1"
                      onClick={() => {
                        navigator.clipboard.writeText(abUserInfo?.walletAddress || "");
                        toast.success(tCommon("copySuccess"));
                      }}
                    >
                      {/* <div className="w-[14px] h-[14px] bg-white"></div> */}
                      <span className="font-medium text-cyan-600 text-[10px]">
                        {truncateString(abUserInfo?.walletAddress || "-", 4, 4)}
                      </span>

                      <Image src={copy} alt="copy" width={12} height={12} className="ml-3" />
                    </div>
                  )}
                </div>
              </div>
              {isConnected && address ? (
                <div
                  className="font-baloo font-bold text-cyan-500 text-xs px-4 h-[32px] leading-[32px] bg-cyan-50 rounded-[16px] border border-cyan-950"
                  style={{
                    fontFamily: "var(--font-baloo)",
                    boxShadow: `2px 2px 0px 0px ${colors.cyan950}`,
                  }}
                  onClick={handleDisconnectClick}
                >
                  {tCommon("disconnectWallet")}
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setOpenConnectWalletGuideSheet(true)}
                    className="font-baloo font-bold text-cyan-950 text-xs px-4 h-[32px] leading-[32px] bg-cyan-300 rounded-[16px] border border-cyan-950"
                    style={{
                      fontFamily: "var(--font-baloo)",
                      boxShadow: `2px 2px 0px 0px ${colors.cyan950}`,
                    }}
                  >
                    {tCommon("connectWallet")}
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

          <div
            className={`h-[32px] flex items-center px-4 px-2 ${
              abUserInfo?.walletType === "AB_Wallet" ? "bg-amber-200" : "bg-cyan-700"
            } border-t-1 border-dashed border-cyan-950 font-medium text-amber-950 text-[10px]`}
          >
            {abUserInfo?.walletType === "AB_Wallet" ? (
              <div className="flex items-center">
                <Image src={commonInfoActive} alt="arrow" className="w-[14px] h-[14px]" />
                <div>
                  Your <span className="font-bold text-amber-500 -pt-[2px]">+10%</span> Points Boost
                  is Activated
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <Image src={commonInfo} alt="arrow" className="w-[14px] h-[14px]" />
                <div className="text-cyan-50 ml-1">
                  {(() => {
                    const tipText = abUserInfo?.walletAddress
                      ? t("switchWalletTip")
                      : t("connectToWalletTip");
                    // 匹配 "AB wallet"、"AB 钱包" 和 "+10%"
                    const parts = tipText.split(/(AB wallet|AB 钱包|\+10%)/);
                    return parts.map((part, index) => {
                      if (part === "AB wallet" || part === "AB 钱包" || part === "+10%") {
                        return (
                          <span key={index} className="font-bold text-cyan-300 -pt-[2px]">
                            {part}
                          </span>
                        );
                      }
                      return <span key={index}>{part}</span>;
                    });
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          className={`rounded-[16px] border border-cyan-950 p-4 mt-4 ${
            petInfo?.petStatus && petInfo?.petStatus !== 50 ? "bg-cyan-200" : "bg-slate-200"
          }`}
          style={{
            boxShadow: `2px 2px 0px 0px ${colors.cyan950}`,
          }}
        >
          <div className="flex justify-between">
            <div className="flex items-center">
              <Image src={petHead} alt="pet" className="w-[24px]" />
              <span className="font-semibold text-cyan-800 text-xs ml-1">{t("totalPoints")}</span>
            </div>

            {abUserInfo?.id && petInfo?.petStatus && petInfo?.petStatus !== 50 && (
              <button
                onClick={() => handleHistoryClick("")}
                className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
              >
                <span
                  className={`font-semibold text-xs ${
                    petInfo?.petStatus && petInfo?.petStatus !== 50
                      ? "text-cyan-600"
                      : "text-slate-600"
                  }`}
                >
                  {tCommon("history")}
                </span>

                <Image src={arrowRight} alt="arrow" className="w-[18px] h-[18px]" />
              </button>
            )}
          </div>

          <div
            className={`mt-2 py-6 border-2  rounded-[8px] ${
              petInfo?.petStatus && petInfo?.petStatus !== 50
                ? "bg-cyan-50 border-cyan-300"
                : "bg-slate-50 border-slate-300"
            }`}
          >
            {/* Large number display */}
            <div
              className={`flex items-center justify-center font-baloo font-bold  text-4xl ${
                petInfo?.petStatus && petInfo?.petStatus !== 50 ? "text-cyan-600" : "text-slate-400"
              }`}
              style={{
                fontFamily: "var(--font-baloo)",
              }}
            >
              {abUserInfo?.totalPoints || 0}
            </div>

            {!abUserInfo?.id && (
              <div className="mx-auto w-[135px] font-bold text-xs text-center text-slate-700 mt-1">
                {t("connectWalletTip")}
              </div>
            )}

            {abUserInfo?.id && petInfo?.petStatus && petInfo?.petStatus === 50 && (
              <div className="mx-auto w-[135px] font-bold text-xs text-center text-slate-700 mt-1">
                {t("activePetTip")}
              </div>
            )}

            {/* Three cards row */}
            <div className="flex gap-2 mt-4 px-4">
              {/* Mission Card */}
              <div
                className={`flex-1 flex flex-col items-center justify-center border-2 rounded-[8px] py-6 ${
                  petInfo?.petStatus && petInfo?.petStatus !== 50
                    ? "border-cyan-300 bg-cyan-200"
                    : "border-slate-300 bg-slate-200"
                }`}
                onClick={() => {
                  handleHistoryClick("mission");
                }}
              >
                <span
                  className={`font-baloo font-bold  text-md w-[60px] ${
                    petInfo?.petStatus && petInfo?.petStatus !== 50
                      ? "text-cyan-600"
                      : "text-slate-400"
                  }`}
                  style={{
                    fontFamily: "var(--font-baloo)",
                  }}
                >
                  {abUserInfo?.taskPoints || 0}
                </span>
                <div
                  className={`flex items-center text-xs font-bold w-[60px] ${
                    petInfo?.petStatus && petInfo?.petStatus !== 50
                      ? "text-cyan-950"
                      : "text-slate-500"
                  }`}
                >
                  <span>{tCommon("mission")}</span>
                  <Image src={arrowRight} alt="arrow" className="w-[18px] h-[18px]" />
                </div>
              </div>

              {/* Referral Card */}
              <div
                className={`flex-1 flex flex-col items-center justify-center border-2 rounded-[8px] py-6 ${
                  petInfo?.petStatus && petInfo?.petStatus !== 50
                    ? "border-cyan-300 bg-cyan-200"
                    : "border-slate-300 bg-slate-200"
                }`}
                onClick={() => {
                  handleHistoryClick("invite");
                }}
              >
                <span
                  className={`font-baloo font-bold  text-md w-[68px] ${
                    petInfo?.petStatus && petInfo?.petStatus !== 50
                      ? "text-cyan-600"
                      : "text-slate-400"
                  }`}
                  style={{
                    fontFamily: "var(--font-baloo)",
                  }}
                >
                  {abUserInfo?.invitePoints || 0}
                </span>
                <div
                  className={`flex items-center text-xs font-bold w-[68px] ${
                    petInfo?.petStatus && petInfo?.petStatus !== 50
                      ? "text-cyan-950"
                      : "text-slate-500"
                  }`}
                >
                  <span>{tCommon("invite")}</span>
                  <Image src={arrowRight} alt="arrow" className="w-[18px] h-[18px]" />
                </div>
              </div>

              {/* Mining Card */}
              <div
                className={`flex-1 flex flex-col items-center justify-center border-2 rounded-[8px] py-6 ${
                  petInfo?.petStatus && petInfo?.petStatus !== 50
                    ? "border-cyan-300 bg-cyan-200"
                    : "border-slate-300 bg-slate-200"
                }`}
                onClick={() => {
                  handleHistoryClick("mining");
                }}
              >
                <span
                  className={`font-baloo font-bold  text-md w-[56px] ${
                    petInfo?.petStatus && petInfo?.petStatus !== 50
                      ? "text-cyan-600"
                      : "text-slate-400"
                  }`}
                  style={{
                    fontFamily: "var(--font-baloo)",
                  }}
                >
                  {abUserInfo?.petPoints || 0}
                </span>
                <div
                  className={`flex items-center text-xs font-bold w-[56px] ${
                    petInfo?.petStatus && petInfo?.petStatus !== 50
                      ? "text-cyan-950"
                      : "text-slate-500"
                  }`}
                >
                  <span>{tCommon("mining")}</span>
                  <Image src={arrowRight} alt="arrow" className="w-[18px] h-[18px]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
