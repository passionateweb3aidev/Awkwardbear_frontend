"use client";

import Image from "next/image";
import Header from "@/components/Header";
import rocket from "@/assets/icon/team-rocket.png";
import inviteTip from "@/assets/icon/team-invite-tip.png";
import inviteTipZh from "@/assets/icon/team-invite-tip-zh.png";
import { colors } from "@/assets/color";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import share from "@/assets/icon/share.png";
import InviteStatus from "./InviteStatus";
import StatusAndReward from "./StatusAndReward";
import { useContext, useEffect, useRef, useState } from "react";
import { ABUserContext } from "@/providers/WalletAuthSync";
import toast from "react-hot-toast";
import { team } from "@/services";
import { TeamInfoResponse, TeamPointsResponse, TeamSummaryResponse } from "@/services/team";
import connectWalletWithTip from "@/assets/icon/home-connect-button-with-tip.png";
import connectWalletWithTipZh from "@/assets/icon/home-connect-button-with-tip-zh.png";
import { Sheet } from "@/components/ui/sheet";
import ConnectWalletGuideSheetContent from "@/components/ConnectWalletGuideSheetContent";
import { useWalletConnect } from "@/contexts/WalletConnectContext";
import { useIsZh } from "@/utils/i18n";
import { useTranslations } from "next-intl";
import { envConfig } from '@/config/env';

export default function Team() {
  const abUserInfo = useContext(ABUserContext);
  const [teamInfo, setTeamInfo] = useState<TeamInfoResponse>([]);
  const [teamSummary, setTeamSummary] = useState<TeamSummaryResponse>({
    boundWalletCount: 0,
    activeUserCount: 0,
  });
  const [teamPoints, setTeamPoints] = useState<TeamPointsResponse>([]);
  const [openConnectWalletGuideSheet, setOpenConnectWalletGuideSheet] = useState(false);
  const { connect } = useWalletConnect();
  const prevUserIdRef = useRef<string | undefined>(undefined);
  const isZh = useIsZh();
  const t = useTranslations("team");
  const getInviteInfo = async () => {
    team.get().then((res) => {
      setTeamInfo(res.data);
    });
    team.summary().then((res) => {
      setTeamSummary(res.data);
    });
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    team.points(yesterday.toISOString()).then((res) => {
      setTeamPoints(res.data);
    });
  };

  useEffect(() => {
    const currentUserId = abUserInfo?.id;
    const prevId = prevUserIdRef.current;
    if (!currentUserId) return;
    if (currentUserId === prevId && prevId !== undefined) {
      console.warn(
        "[Team useEffect] ⚠️ id 未变化但 effect 被触发！可能是 React StrictMode 或组件重新挂载导致",
      );
      return;
    }
    prevUserIdRef.current = currentUserId;
    getInviteInfo();
  }, [abUserInfo?.id]);

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(abUserInfo?.inviteCode || "");
    toast.success(t("inviteCodeCopySuccess"));
  };

  return (
    <div
      className="min-h-screen font-quicksand"
      // style={{
      //   backgroundImage: `url(${backgroundImage.src})`,
      //   backgroundSize: "100% auto",
      //   backgroundRepeat: "repeat",
      //   fontFamily: "var(--font-quicksand)",
      // }}
    >
      <Header />
      <main className="relative">
        <div className="p-4 flex-col">
          <Image src={rocket} alt="team" className="w-[54px] h-[54px] mx-auto" />
          <p
            className="font-bold text-cyan-950 text-center mt-2"
            style={{ fontFamily: "var(--font-baloo)" }}
          >
            {t("squadEngineTitle")}
          </p>
          <p
            className="font-medium text-cyan-700 text-center mt-1 text-xs"
            dangerouslySetInnerHTML={{ __html: t("squadEngineDesc") }}
          />
          <Image src={isZh ? inviteTipZh : inviteTip} alt="team" className="w-full mt-6" />

          {abUserInfo?.id ? (
            <>
              {/* invite code */}
              <div
                className="rounded-2xl bg-cyan-200 p-4 border-1 border-cyan-950 mt-4"
                style={{
                  boxShadow: `2px 2px 0px 0px ${colors.cyan950}`,
                }}
              >
                {/* <div>
                  <p>{t("yourInviteCode")}</p>
                  <div className="relative">
                    <Input
                      readOnly
                      className="bg-white border-1 border-cyan-600 rounded-lg h-[40px] font-bold text-sm"
                      value={abUserInfo?.inviteCode || ""}
                    />
                    <Button
                      className="absolute right-0 top-0 border-1 p-0 border-cyan-600 w-[40px] h-[40px] bg-cyan-300 rounded-l-none rounded-r-lg flex items-center justify-center"
                      onClick={handleCopyInviteCode}
                    >
                      <Image src={copy} alt="copy" className="w-[18px] h-[18px]" />
                    </Button>
                  </div>
                </div> */}

                <div>
                  <p>{t("yourInviteLink")}</p>
                  <div className="relative">
                    <Input
                      readOnly
                      className="bg-white border-1 border-cyan-600 rounded-lg h-[40px] font-medium text-[10px] pr-12 truncate"
                      value={`${envConfig.inviteLinkDomain}/?inviteCode=${
                        abUserInfo?.inviteCode || ""
                      }`}
                    />
                    <Button
                      className="absolute right-0 top-0 border-1 p-0 border-cyan-600 w-[40px] h-[40px] bg-cyan-300 rounded-l-none rounded-r-lg flex items-center justify-center"
                      // onClick={handlePaste}
                    >
                      <Image
                        src={share}
                        alt="copy"
                        className="w-[18px] h-[18px]"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${envConfig.inviteLinkDomain}/?inviteCode=${abUserInfo?.inviteCode || ""}`,
                          );
                          toast.success(t("inviteCodeCopySuccess"));
                        }}
                      />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <InviteStatus teamSummary={teamSummary} />
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                className="w-full"
                onClick={() => setOpenConnectWalletGuideSheet(true)}
              >
                <Image
                  src={isZh ? connectWalletWithTipZh : connectWalletWithTip}
                  alt="connect wallet with tip"
                  className="w-[60%] mt-2 mx-auto"
                />
              </button>
              <Sheet open={openConnectWalletGuideSheet} onOpenChange={setOpenConnectWalletGuideSheet}>
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

        {abUserInfo?.id && (
          <div className="relative z-1 top-3">
            <StatusAndReward teamInfo={teamInfo} teamPoints={teamPoints} />
          </div>
        )}
      </main>
    </div>
  );
}
