"use client";

import Image from "next/image";
import petHead from "@/assets/icon/home-pet-head.png";
import petGift from "@/assets/icon/home-pet-gift.png";
import petDailyCheck from "@/assets/icon/home-pet-daily-check.png";
import { colors } from "@/assets/color";
import { useContext, useState } from "react";
import { ABUserContext } from "@/providers/WalletAuthSync";
import { Sheet } from "@/components/ui/sheet";
import FeedTaskGuideSheetContent from "@/components/FeedTaskGuideSheetContent";
import { TaskItem } from "@/services/task";
import { useTranslations } from "next-intl";
import { openLinkSafely } from "@/utils/telegramLink";

const TEXT_STROKE_SHADOW = `
  -1px -1px 0 ${colors.cyan950},
  1px -1px 0 ${colors.cyan950},
  -1px 1px 0 ${colors.cyan950},
  1px 1px 0 ${colors.cyan950},
  0 -1px 0 ${colors.cyan950},
  0 1px 0 ${colors.cyan950},
  -1px 0 0 ${colors.cyan950},
  1px 0 0 ${colors.cyan950}
`.trim();

export default function PetStatus({
  tasksList,
  handleClickTask,
  giftRewardDetails,
}: {
  tasksList: TaskItem[];
  handleClickTask: (taskItem: TaskItem) => void;
  giftRewardDetails: {
    criticalImpressionCount: number;
    criticalImpressionPoints: number;
    criticalLikeCount: number;
    criticalLikePoints: number;
    rewardPoints: number;
  };
}) {
  const [openFeedTaskGuideSheet, setOpenFeedTaskGuideSheet] = useState(false);
  const abUserInfo = useContext(ABUserContext);
  const dailyTask = tasksList.find((task) => task.taskCode === "DAILY_GIFT");
  const checkInTask = tasksList.find((task) => task.taskCode === "CHECK_IN");
  const t = useTranslations("home");
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-end">
        <Image src={petHead} alt="pet" className="w-[24px] h-[24px]" />
        <span
          className="font-bold text-center font-baloo text-[22px] tracking-wide ml-1"
          style={{
            fontFamily: "var(--font-baloo)",
            color: colors.slate50,
            textShadow: TEXT_STROKE_SHADOW,
          }}
        >
          {abUserInfo?.totalPoints || 0}
        </span>
      </div>

      <div
        className="flex flex-col items-end mt-6"
        onClick={() => {
          if (!dailyTask) return;
          handleClickTask(dailyTask);
        }}
      >
        <Image src={petGift} alt="pet" className="w-[40px] h-[40px]" />
        <p className="text-bold text-sm">
          <span
            className="font-bold text-center font-baloo tracking-wide"
            style={{
              fontFamily: "var(--font-baloo)",
              color: colors.slate50,
              textShadow: TEXT_STROKE_SHADOW,
            }}
          >
            {t("taskDailyGift")}
          </span>
          <span
            className="font-bold text-center font-baloo tracking-wide ml-2"
            style={{
              fontFamily: "var(--font-baloo)",
              color: colors.slate50,
              textShadow: TEXT_STROKE_SHADOW,
            }}
          >
            ({dailyTask?.completedCount}/{dailyTask?.maxCompletion})
          </span>
        </p>
      </div>

      <div
        className="flex flex-col items-end mt-6"
        onClick={() => {
          if (!checkInTask) return;
          handleClickTask(checkInTask);
        }}
      >
        <Image src={petDailyCheck} alt="pet" className="w-[40px] h-[40px]" />
        <p
          className="text-sm font-bold text-center font-baloo tracking-wide"
          style={{
            fontFamily: "var(--font-baloo)",
            color: colors.slate50,
            textShadow: TEXT_STROKE_SHADOW,
          }}
        >
          {t("taskDailyCheck")}
        </p>
      </div>

      <Sheet open={openFeedTaskGuideSheet} onOpenChange={setOpenFeedTaskGuideSheet}>
        <FeedTaskGuideSheetContent
          openFeedTaskGuideSheet={openFeedTaskGuideSheet}
          giftRewardDetails={giftRewardDetails}
          handleGoToPost={() => {
            openLinkSafely("https://x.com/compose/post");
          }}
          handlePaste={() => {
            navigator.clipboard.readText().then((text) => {
              console.log(text);
            });
          }}
          handleSubmit={() => {}}
        />
      </Sheet>
    </div>
  );
}
