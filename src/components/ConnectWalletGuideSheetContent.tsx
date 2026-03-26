"use client";

import Image, { StaticImageData } from "next/image";
import { SheetContent, SheetTitle } from "./ui/sheet";
import connectExist from "@/assets/icon/connect-wallet-guide-connect-exist.png";
import connectExistZh from "@/assets/icon/connect-wallet-guide-connect-exist-zh.png";
import downloadAB from "@/assets/icon/connect-wallet-guide-download-ab.png";
import downloadABZh from "@/assets/icon/connect-wallet-guide-download-ab-zh.png";
import connectWalletIcon from "@/assets/icon/connect-wallet.png";
import connectWalletTip1 from "@/assets/icon/connect-wallet-icon-1.png";
import connectWalletTip2 from "@/assets/icon/connect-wallet-icon-2.png";
import connectWalletTip3 from "@/assets/icon/connect-wallet-icon-3.png";
import connectWalletTip4 from "@/assets/icon/connect-wallet-icon-4.png";
import { useIsZh } from "@/utils/i18n";
import { useTranslations } from "next-intl";
import { openLinkSafely } from "@/utils/telegramLink";

export const ExtraInfoItem = ({
  image,
  description,
}: {
  image: StaticImageData | string;
  description: string | React.ReactNode;
}) => {
  return (
    <div className="flex items-center rounded-lg bg-cyan-50 h-[34px] px-2">
      {typeof description === "string" ? (
        typeof image === "string" ? (
          <div className="w-[14px] h-[14px] bg-cyan-950" />
        ) : (
          <Image src={image} alt="image" width={14} height={14} />
        )
      ) : null}
      <div className="font-bold text-xs text-cyan-900 ml-2">{description}</div>
    </div>
  );
};

export default function ConnectWalletGuideSheetContent({
  handleClickConnectWallet,
}: {
  handleClickConnectWallet: () => void;
}) {
  const isZh = useIsZh();
  const t = useTranslations("connectWallet");

  const unlockItems = [
    {
      image: connectWalletTip1,
      description: t("unlockItem1"),
    },
    {
      image: connectWalletTip2,
      description: t("unlockItem2"),
    },
    {
      image: connectWalletTip3,
      description: t("unlockItem3"),
    },
    {
      image: connectWalletTip4,
      description: t("unlockItem4"),
    },
  ];

  return (
    <SheetContent side="bottom" className="z-50 rounded-t-2xl bg-cyan-50 px-4 pb-[80px]">
      <SheetTitle className="sr-only">Connect Wallet Guide</SheetTitle>
      <div
        className="flex flex-col items-center justify-center font-quicksand"
        style={{ fontFamily: "var(--font-quicksand)" }}
      >
        <Image
          src={connectWalletIcon}
          alt="connect wallet icon"
          width={64}
          height={64}
          className="w-[64px] h-[64px]"
        />
        <p className="mt-4 font-bold text-base text-cyan-950">{t("title")}</p>
        <p className="text-xs font-medium text-cyan-700">{t("desc")}</p>
      </div>

      {/* buttons */}
      <div className="mt-4">
        <div className="flex flex-col px-4 max-w-[352px] mx-auto">
          <Image
            src={isZh ? downloadABZh : downloadAB}
            alt="download AB"
            onClick={() => {
              openLinkSafely("https://www.abpay.cash/");
            }}
          />
          <Image
            src={isZh ? connectExistZh : connectExist}
            alt="connect exist"
            className="mt-3"
            onClick={handleClickConnectWallet}
          />
        </div>
      </div>

      {/* After connecting your wallet, you will unlock... */}
      <div
        className="mt-6 bg-cyan-100 rounded-xl p-2 max-w-[352px] mx-auto font-quicksand"
        style={{ fontFamily: "var(--font-quicksand)" }}
      >
        <p className="text-xs font-medium mb-1">{t("afterConnected")}</p>
        {unlockItems.map((item) => (
          <div className="mt-1" key={item.description}>
            <ExtraInfoItem image={item.image} description={item.description} />
          </div>
        ))}
      </div>
    </SheetContent>
  );
}
