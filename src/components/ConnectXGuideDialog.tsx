import { DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { colors } from "@/assets/color";
import { ExtraInfoItem } from "./ConnectWalletGuideSheetContent";
import close from "@/assets/icon/home-close.png";
import Image from "next/image";
import connectX from "@/assets/icon/connect-X.png";
import connectXTip1 from "@/assets/icon/connect-X-icon-1.png";
import connectXTip2 from "@/assets/icon/connect-X-icon-2.png";
import connectXTip3 from "@/assets/icon/connect-X-icon-3.png";
import { useTranslations } from "next-intl";

export default function ConnectXGuideDialog({
  handleCancel,
  handleClose,
  handleConnect,
}: {
  handleCancel: () => void;
  handleClose: () => void;
  handleConnect: () => void;
}) {
  const t = useTranslations("connectX");
  const commonT = useTranslations("common");
  const connectedItems = [
    {
      image: connectXTip1,
      description: t("rewardTip1"),
    },
    {
      image: connectXTip2,
      description: t("rewardTip2"),
    },
    {
      image: connectXTip3,
      description: t("rewardTip3"),
    },
  ];

  return (
    <DialogContent
      hideClose
      disableOverlayClose
      className="p-0 border-none overflow-hidden w-[90%] max-w-[402px] mx-auto bg-transparent"
      style={{
        boxShadow: "none",
      }}
    >
      <DialogHeader className="sr-only">
        <DialogTitle>{t("title")}</DialogTitle>
      </DialogHeader>

      <div className="bg-cyan-50 rounded-2xl p-4 overflow-hidden">
        <div
          className="flex flex-col items-center justify-center font-quicksand"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          <Image src={connectX} alt="x" width={64} height={64} className="w-[64px] h-[64px]" />
          <p className="mt-4 font-bold text-base text-cyan-950">{t("title")}</p>
          <p className="text-xs font-medium text-cyan-700">{t("desc")}</p>
        </div>

        {/* buttons */}
        <div
          className="mt-4 flex gap-2 max-w-[352px] mx-auto font-baloo"
          style={{ fontFamily: "var(--font-baloo)" }}
        >
          <Button
            className="h-[40px] bg-cyan-50 text-cyan-500 flex-1 rounded-2xl font-bold leading-[normal]"
            style={{
              border: `1px solid ${colors.cyan950}`,
              boxShadow: "2px 2px 0px 0px #082F49",
            }}
            onClick={handleCancel}
          >
            {commonT("cancel")}
          </Button>

          <Button
            className="h-[40px] bg-cyan-300 text-cyan-950 flex-1 rounded-2xl font-bold leading-[normal]"
            style={{
              border: `1px solid ${colors.cyan950}`,
              boxShadow: "2px 2px 0px 0px #082F49",
            }}
            onClick={handleConnect}
          >
            {commonT("connectWallet")}
          </Button>
        </div>

        {/* Once connected:... */}
        <div
          className="mt-6 bg-cyan-100 rounded-xl p-2 max-w-[352px] mx-auto font-quicksand"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          <p className="text-xs font-medium mb-1">{t("onceConnected")}</p>
          {connectedItems.map((item) => (
            <div className="mt-1" key={item.description}>
              <ExtraInfoItem image={item.image} description={item.description} />
            </div>
          ))}
        </div>
      </div>
      <Image
        src={close}
        alt="close"
        className="w-[32px] h-[32px] mt-6 mx-auto"
        onClick={handleClose}
      />
    </DialogContent>
  );
}
