"use client";

import Image from "next/image";
import { SheetContent, SheetTitle } from "./ui/sheet";
import { ExtraInfoItem } from "./ConnectWalletGuideSheetContent";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { colors } from "@/assets/color";
import { useCallback, useEffect, useState } from "react";
import petHead from "@/assets/icon/home-pet-head.png";
import dailyGiftReward0 from "@/assets/icon/daily-gift-reward-0.png";
import dailyGiftReward1 from "@/assets/icon/daily-gift-reward-1.png";
import dailyGiftReward2 from "@/assets/icon/daily-gift-reward-2.png";
import giftStatusCheck from "@/assets/icon/gift-status-check.png";
import giftStatusPending from "@/assets/icon/gift-status-pending.png";
import giftStatusReject from "@/assets/icon/gift-status-reject.png";
import { task } from "@/services";
import dayjs from "dayjs";
import arrowRight from "@/assets/icon/profile-arrow-right.png";
import { openLinkSafely } from "@/utils/telegramLink";
import { useTranslations, useMessages } from "next-intl";

export default function FeedTaskGuideSheetContent({
  handlePaste,
  handleGoToPost,
  handleSubmit,
  giftRewardDetails,
  openFeedTaskGuideSheet,
}: {
  handlePaste: () => void;
  handleGoToPost: () => void;
  handleSubmit: (link: string) => void;
  giftRewardDetails: {
    criticalImpressionCount: number;
    criticalImpressionPoints: number;
    criticalLikeCount: number;
    criticalLikePoints: number;
    rewardPoints: number;
  };
  openFeedTaskGuideSheet: boolean;
}) {
  const t = useTranslations("home");
  const messages = useMessages();
  const boostRewardsItems = [
    {
      image: dailyGiftReward0,
      id: 1,
      description: t("taskAnyPost"),
      points: giftRewardDetails?.rewardPoints,
    },
    {
      image: dailyGiftReward2,
      id: 2,
      description: `${giftRewardDetails?.criticalImpressionCount}+ ${t("taskViews")}`,
      points: giftRewardDetails?.criticalImpressionPoints,
    },
    {
      image: dailyGiftReward1,
      id: 3,
      description: `${giftRewardDetails?.criticalLikeCount}+ ${t("taskLikes")}`,
      points: giftRewardDetails?.criticalLikePoints,
    },
  ];

  const [link, setLink] = useState("");
  const [dailyGiftRecords, setDailyGiftRecords] = useState<
    {
      completeTime: number;
      tweetStatus: number;
      changePoints: number;
      description: string;
      url: string;
    }[]
  >([]);

  useEffect(() => {
    console.log("openFeedTaskGuideSheet", openFeedTaskGuideSheet);
    if (openFeedTaskGuideSheet) {
      task.dailyGiftRecords().then((res) => {
        setDailyGiftRecords(res.data);
      });
    }
  }, [openFeedTaskGuideSheet]);

  useEffect(() => {
    console.log(">>> dailyGiftRecords", dailyGiftRecords);
  }, [dailyGiftRecords]);

  const handleClickSubmit = useCallback(() => {
    handleSubmit(link);
  }, [handleSubmit, link]);

  return (
    <SheetContent
      side="bottom"
      className="z-50 rounded-t-2xl bg-cyan-50 px-8 pb-[40px] max-h-[80vh] overflow-y-auto"
    >
      <SheetTitle className="sr-only">Feed Task Guide</SheetTitle>

      {/* steps */}
      <div className="font-quicksand" style={{ fontFamily: "var(--font-quicksand)" }}>
        {/* step 1 */}
        <div>
          <p className="text-xs font-bold text-cyan-700">{t("taskStep")} 1</p>
          <p className="text-base font-bold text-cyan-900">{t("taskPostOnX")}</p>
          <p className="mt-4 text-xs font-medium text-cyan-700">
            {(() => {
              // 从原始消息对象获取未格式化的字符串
              const rawText = (messages.home as { taskPostXTip?: string })?.taskPostXTip || "";
              const parts = rawText.split(/\{0\}|\{1\}/);
              const matches = rawText.match(/\{0\}|\{1\}/g) || [];
              const result: React.ReactNode[] = [];
              parts.forEach((part, index) => {
                if (part) result.push(part);
                if (matches[index] === "{0}") {
                  result.push(
                    <span key="0" className="text-cyan-500">
                      @AwkwardBearfi
                    </span>,
                  );
                } else if (matches[index] === "{1}") {
                  result.push(
                    <span key="1" className="text-cyan-500">
                      #AwkwardBear #ABDAO
                    </span>,
                  );
                }
              });
              return result;
            })()}
          </p>
          <Button
            className="mt-4 w-full h-[40px] rounded-2xl font-bold leading-[normal] font-baloo bg-cyan-300 text-cyan-950"
            style={{
              fontFamily: "var(--font-baloo)",
              border: `1px solid ${colors.cyan950}`,
              boxShadow: "2px 2px 0px 0px #082F49",
            }}
            onClick={handleGoToPost}
          >
            {t("taskGoToPost")}
          </Button>
        </div>

        {/* step 2 */}
        <div className="mt-6">
          <p className="text-xs font-bold text-cyan-700">{t("taskStep")} 2</p>
          <p className="text-base font-bold text-cyan-900">{t("taskSubmitLinkTitle")}</p>
          <div className="mt-4 relative">
            <Input
              placeholder={t("taskPasteLinkTip")}
              className="bg-white border-1 border-cyan-600 rounded-lg h-[40px]"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>
          <Button
            className="mt-4 w-full h-[40px] rounded-2xl font-bold leading-[normal] font-baloo bg-cyan-300 text-cyan-950 disabled:bg-slate-200"
            style={{
              fontFamily: "var(--font-baloo)",
              border: `1px solid ${colors.cyan950}`,
              boxShadow: "2px 2px 0px 0px #082F49",
            }}
            onClick={handleClickSubmit}
            disabled={!link}
          >
            {t("taskSend")}
          </Button>
        </div>
      </div>

      {/* Daily Gift Records */}
      {dailyGiftRecords.length > 0 && (
        <div>
          <div className="mt-6 border-t border-dashed border-cyan-500" />
          <p className="mt-4 text-xs font-semibold flex items-center">
            <span className="text-cyan-950">{t("taskGiftHistory")}</span>{" "}
            <span className="text-cyan-500 ml-1">
              ({dailyGiftRecords.filter((item) => item.tweetStatus === 10).length}/
              {dailyGiftRecords.length})
            </span>
          </p>
          <div className="mt-3 bg-cyan-100 rounded-xl p-2 mx-auto font-quicksand">
            {dailyGiftRecords.map((item, index) => (
              <div
                key={`dailyGiftRecords-${index}`}
                className="flex items-center justify-between h-[32px]"
                onClick={() => {
                  if (!item.url) {
                    return;
                  }
                  openLinkSafely(item.url);
                }}
              >
                <div className="flex items-center text-xs font-semibold">
                  <Image
                    src={
                      item.tweetStatus === 10
                        ? giftStatusCheck
                        : item.tweetStatus === 20
                          ? giftStatusReject
                          : giftStatusPending
                    }
                    alt="gift"
                    className="w-[14px] h-[14px]"
                  />
                  <span className="text-cyan-600 ml-1">{index + 1}</span>
                  <span className="ml-4">{dayjs(item.completeTime).format("HH:mm")}</span>
                </div>
                <div className="flex items-center">
                  {item.changePoints && (
                    <span className="font-bold text-xs text-cyan-500">+{item.changePoints}</span>
                  )}
                  {item.tweetStatus === 20 && (
                    <span className="text-xs font-bold text-pink-500">{t("taskRejected")}</span>
                  )}
                  {item.tweetStatus === 0 && (
                    <span className="text-xs font-bold text-slate-500">{t("taskPending")}...</span>
                  )}
                  {item.tweetStatus === 10 && (
                    <Image src={arrowRight} alt="arrow" className="w-[24px] h-[24px]" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Boost Rewards... */}
      <div>
        <div className="mt-6 border-t border-dashed border-cyan-500" />
        <div
          className="mt-6 bg-cyan-100 rounded-xl p-2 mx-auto font-quicksand"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          <p className="text-xs font-medium mb-1">{t("taskBoostRewards")}</p>
          {boostRewardsItems.map((item) => (
            <div className="mt-1" key={item.id}>
              <ExtraInfoItem
                image={item.image}
                description={
                  <div className="flex">
                    <Image src={item.image} alt="reward" className="w-[16px] h-[16px]" />
                    <span className="ml-2"> {item.description} - </span>
                    <Image src={petHead} alt="pet" className="w-[16px] h-[16px] ml-1" />
                    <span className="ml-1"> + {item.points}</span>
                  </div>
                }
              />
            </div>
          ))}
        </div>
      </div>
    </SheetContent>
  );
}
