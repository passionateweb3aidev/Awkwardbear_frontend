"use client";

import { colors } from "@/assets/color";
import Image, { StaticImageData } from "next/image";
import petGift from "@/assets/icon/home-pet-gift.png";
import petDailyCheck from "@/assets/icon/home-pet-daily-check.png";
import petTaskJoinTg from "@/assets/icon/home-task-join-tg.png";
import petTaskFollowX from "@/assets/icon/connect-X.png";
import petTaskFollowAbDao from "@/assets/icon/connect-X.png";
import petHead from "@/assets/icon/home-pet-head.png";
import arrowRight from "@/assets/icon/home-arrow-right.png";
import { TaskItem as ITaskItem } from "@/services/task";
import { useLocalizedField } from "@/utils/i18n";
import pedHeadGo from "@/assets/icon/home-task-go.png";
import pedHeadPending from "@/assets/icon/home-task-pending.png";
import pedHeadClaim from "@/assets/icon/home-task-claim.png";
import petHeadDone from "@/assets/icon/home-task-done.png";
import petHeadRetry from "@/assets/icon/home-task-retry.png";
import petConnectWallet from "@/assets/icon/connect-wallet.png";
import infoActive from "@/assets/icon/common-info-active.png";
import { useTranslations } from "next-intl";
import { useContext } from "react";
import { ABUserContext } from "@/providers/WalletAuthSync";

const TASK_ICON_MAP: Record<string, StaticImageData | null> = {
  BIND_WALLET: null,
  CHECK_IN: petDailyCheck,
  DAILY_GIFT: petGift,
  FOLLOW_US: petTaskFollowX,
  FOLLOW_ABDAO: petTaskFollowAbDao,
  HATCHING_PET: petConnectWallet,
  JOIN_TELEGRAM: petTaskJoinTg,
};

// 状态：0-待审核，10-未领取，20-已领取，30-审批失败
const getTaskIcon = (taskCode: string, taskStatus: number | null) => {
  switch (taskStatus) {
    case 0:
      return pedHeadPending;
    case 10:
      return pedHeadClaim;
    case 20:
      return petHeadDone;
    case 30:
      return petHeadRetry;
  }
  return pedHeadGo;
};

const getTaskButtonText = (t: ReturnType<typeof useTranslations>, taskStatus: number | null) => {
  switch (taskStatus) {
    case 0:
      return t("taskPending");
    case 10:
      return t("taskClaim");
    case 20:
      return t("taskDone");
    case 30:
      return t("taskRetry");
  }
  return t("taskGo");
};

const getTaskButtonBg = (taskStatus: number | null) => {
  switch (taskStatus) {
    case 0:
      return "bg-slate-300";
    case 10:
      return "bg-amber-400";
    case 20:
      return "bg-slate-300";
  }
  return "bg-cyan-200";
};

export default function TaskItem({
  task,
  giftRewardDetails,
  handleClickTask,
}: {
  task: ITaskItem;
  giftRewardDetails: {
    criticalImpressionCount: number;
    criticalImpressionPoints: number;
    criticalLikeCount: number;
    criticalLikePoints: number;
    rewardPoints: number;
  };
  handleClickTask: (task: ITaskItem) => void;
}) {
  const taskName = useLocalizedField(task.taskName, task.taskNameEn);
  const taskDesc = useLocalizedField(task.taskDesc, task.taskDescEn);
  const t = useTranslations("home");
  const abUserInfo = useContext(ABUserContext);
  return (
    <div
      className={`bg-cyan-50 rounded-[16px] py-4 mb-2 box-content ${
        task?.maxCompletion > 1 ? "pb-0" : ""
      }`}
      style={{
        border: `1px solid ${colors.cyan950}`,
        boxShadow: `2px 2px 0px 0px ${colors.cyan950}`,
      }}
      onClick={() => handleClickTask(task)}
    >
      <div className="flex w-full px-4">
        <div className="flex flex-col justify-center w-[70px]">
          <Image
            src={TASK_ICON_MAP[task.taskCode] || petDailyCheck}
            alt={taskName}
            className="w-[40px] h-[40px]"
          />
          <div className="flex items-center mt-2">
            <Image src={petHead} alt="pet" className="w-[14px] h-[14px]" />
            {task.maxCompletion > 1 ? (
              <div
                className="flex items-center font-quicksand font-semibold text-xs ml-1"
                style={{
                  fontFamily: "var(--font-quicksand)",
                }}
              >
                {/* <span className="text-slate-950">{task.rewardPoints}</span> */}
                <span className="text-slate-950">1000</span>
                <Image src={arrowRight} alt="task" className="w-[12px] h-[12px]" />
                <span className="font-bold text-cyan-600">3500</span>
                {/* <span className="font-bold text-cyan-600">
                  {Math.floor(
                    (giftRewardDetails?.rewardPoints || 0) +
                      (giftRewardDetails?.criticalLikePoints || 0) +
                      (giftRewardDetails?.criticalImpressionPoints || 0),
                  )}
                  +
                </span> */}
              </div>
            ) : (
              <div
                className="flex items-center font-quicksand font-semibold text-xs ml-1"
                style={{
                  fontFamily: "var(--font-quicksand)",
                }}
              >
                <span className="text-slate-950">+ {task.rewardPoints}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex justify-center flex-col text-left ml-4">
          <p
            className="font-baloo font-bold text-cyan-950"
            style={{
              fontFamily: "var(--font-baloo)",
            }}
          >
            <span>{taskName}</span>
            {abUserInfo?.id && task?.maxCompletion > 1 ? (
              <span className="ml-1 text-cyan-600">
                ({task.completedCount || 0} / {task.maxCompletion})
              </span>
            ) : null}
          </p>
          <p
            className="font-quicksand font-medium text-slate-950 text-xs"
            style={{
              fontFamily: "var(--font-quicksand)",
            }}
          >
            {taskDesc}
          </p>
        </div>

        <button className="relative min-w-[80px] flex items-start justify-center ml-2">
          <Image
            src={getTaskIcon(task.taskCode, task.rewardStatus)}
            alt="pet"
            className="w-[64px] h-auto relative z-1"
          />
          <div
            className={`absolute bottom-[6px] ${getTaskButtonBg(task.rewardStatus)} w-full h-[28px] text-cyan-950 font-baloo font-bold text-sm leading-[36px] rounded-[16px]`}
            style={{
              border: `0.5px solid ${colors.cyan950}`,
              boxShadow: "2px 2px 0px 0px #082F49",
              fontFamily: "var(--font-baloo)",
            }}
          >
            {getTaskButtonText(t, task.rewardStatus)}
          </div>
        </button>
      </div>

      {task.maxCompletion > 1 && (
        <div className="mt-2 flex items-center justify-center bg-amber-200 rounded-b-[16px] h-[32px]">
          <Image src={infoActive} className="" alt="info" width={14} height={14} />
          <span className="font-semibold text-xs text-amber-800 ml-1">{t("dailyGiftTip")}</span>
        </div>
      )}
    </div>
  );
}
