"use client";

import petHead from "@/assets/icon/home-pet-head.png";
import ConnectWalletGuideSheetContent from "@/components/ConnectWalletGuideSheetContent";
import ConnectXGuideDialog from "@/components/ConnectXGuideDialog";
import FeedTaskGuideSheetContent from "@/components/FeedTaskGuideSheetContent";
import FollowXGuideSheetContent from "@/components/FollowXGuideSheetContent";
import Header from "@/components/Header";
import { Dialog } from "@/components/ui/dialog";
import { Sheet } from "@/components/ui/sheet";
import BEAR_NFT from "@/const/bearNFT";
import { useWalletConnect } from "@/contexts/WalletConnectContext";
import { useWalletTx } from "@/hooks/useWalletTx";
import { useTelegram } from "@/providers/TelegramProvider";
import { ABUserContext } from "@/providers/WalletAuthSync";
import { pet, task, transfer } from "@/services";
import { mint } from "@/services/mint";
import { PetResponse } from "@/services/pet";
import { TaskItem } from "@/services/task";
import { truncateString } from "@/utils/string";
import {
  getTelegramTwitterAuthStartUrl,
  isTelegramMobileWebView,
  isTelegramWebView,
  markTelegramXReturn,
  openLinkSafely,
  openOAuthLinkOutsideTelegram,
} from "@/utils/telegramLink";
import { sleep } from "@/utils/time";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { decodeEventLog, encodeFunctionData, parseEther } from "viem";
import EggStatus from "./EggStatus";
import LatestFed from "./LatestFed";
import PetStatus from "./PetStatus";
import Tasks from "./Tasks";

export interface IPetResource {
  base: string;
  rest: string;
  heart: string;
  coffee: string;
  shake: string;
  mining: string;
  patHead: string;
  gift: string;
  tired: string;
}

const PET_RESOURCE_SUFFIX = {
  base: "base.png",
  rest: "rest.gif",
  heart: "add_points.gif",
  coffee: "drink_coffee.gif",
  shake: "greet.gif",
  mining: "mining.gif",
  patHead: "touch_head.gif",
  gift: "receive_gift.gif",
  tired: "weary.gif",
};

const SUPPER_CHECK_IN_TO = process.env.NEXT_PUBLIC_SUPPER_CHECK_IN_TO as `0x${string}` | undefined;
const SUPPER_CHECK_IN_AMOUNT = process.env.NEXT_PUBLIC_SUPPER_CHECK_IN_AMOUNT;

export default function Home() {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const abUserInfo = useContext(ABUserContext);
  const { connect, isConnected, address, chainId } = useWalletConnect();
  const { sendTransaction, publicClient, switchChain } = useWalletTx();
  const [petInfo, setPetInfo] = useState<PetResponse | null>(null);
  const prevUserIdRef = useRef<string | undefined>(undefined);
  const [taskList, setTaskList] = useState<TaskItem[]>([]);
  const [currentTaskCode, setCurrentTaskCode] = useState<string>("");
  const [openFeedTaskGuideSheet, setOpenFeedTaskGuideSheet] = useState(false);
  const [openFollowXGuideSheet, setOpenFollowXGuideSheet] = useState(false);
  const [openConnectWalletGuideSheet, setOpenConnectWalletGuideSheet] = useState(false);
  const prevTaskUserIdRef = useRef<string | undefined>(undefined);
  const [openConnectXGuideDialog, setOpenConnectXGuideDialog] = useState(false);
  const telegramUserInfo = useTelegram();
  const [petResource, setPetResource] = useState<IPetResource>({
    base: "",
    rest: "",
    heart: "",
    coffee: "",
    shake: "",
    mining: "",
    patHead: "",
    gift: "",
    tired: "",
  });
  const [giftRewardDetails, setGiftRewardDetails] = useState<{
    criticalImpressionCount: number;
    criticalImpressionPoints: number;
    criticalLikeCount: number;
    criticalLikePoints: number;
    rewardPoints: number;
  }>({
    criticalImpressionCount: 0,
    criticalImpressionPoints: 0,
    criticalLikeCount: 0,
    criticalLikePoints: 0,
    rewardPoints: 0,
  });
  const [showRewardToast, setShowRewardToast] = useState(false);
  const [rewardToastInfo, setRewardToastInfo] = useState<{
    text: string;
    points: number;
  } | null>(null);
  const [updatePetInfoTimer, setUpdatePetInfoTimer] = useState<NodeJS.Timeout | null>(null);
  const [isMinting, setIsMinting] = useState(false);

  const getPetResource = async () => {
    const res = await pet.resource().catch((error) => {
      console.error(">>> error", error);
      return { data: null };
    });
    if (!res?.data) {
      return;
    }
    const baseUri = res?.data;
    if (!baseUri) {
      return;
    }
    const targetPetResource = JSON.parse(JSON.stringify(petResource));
    for (const _key of Object.keys(petResource)) {
      const key = _key as keyof IPetResource;
      targetPetResource[key] = `${baseUri}${PET_RESOURCE_SUFFIX[key]}`;
    }
    setPetResource(targetPetResource);
  };

  useEffect(() => {
    const currentUserId = abUserInfo?.id;
    const prevId = prevUserIdRef.current;

    if (!currentUserId) {
      prevUserIdRef.current = currentUserId;
      setPetInfo(null);
      return;
    }

    if (currentUserId === prevId && prevId !== undefined) {
      console.warn(
        "[Home useEffect] ⚠️ id 未变化但 effect 被触发！可能是 React StrictMode 或组件重新挂载导致",
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

    const getTaskDetails = async () => {
      const { data } = await task.details().catch(() => {
        return { data: null };
      });
      if (data) {
        setGiftRewardDetails({
          criticalImpressionCount: data?.criticalImpressionCount || 0,
          criticalImpressionPoints: data?.criticalImpressionPoints || 0,
          criticalLikeCount: data?.criticalLikeCount || 0,
          criticalLikePoints: data?.criticalLikePoints || 0,
          rewardPoints: data?.rewardPoints || 0,
        });
      }
    };

    getUserPetInfo();
    getPetResource();
    getTaskDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abUserInfo?.id]);

  // 添加定时器，每5分钟更新一次宠物信息
  useEffect(() => {
    if (updatePetInfoTimer) {
      clearInterval(updatePetInfoTimer);
    }
    const timer = setTimeout(
      () => {
        if (abUserInfo?.id) {
          handleUpdatePetInfo(false);
        }
      },
      5 * 60 * 1000,
    );
    setUpdatePetInfoTimer(timer);

    return () => {
      if (updatePetInfoTimer) {
        clearInterval(updatePetInfoTimer);
      }
    };
  }, []);

  const getTasks = async () => {
    try {
      const { data } = await task.list();
      console.log(">>> task list", data);
      setTaskList(
        data.map((task) => {
          // 修正字段，当 taskType 为 "DAILY" 时，根据 maxCompletion 和 completedCount 计算 rewardStatus
          if (task?.taskType === "DAILY" && task?.completedCount >= task?.maxCompletion) {
            task.rewardStatus = 20;
          }
          return task;
        }),
      );
    } catch (error) {
      console.error(">>> failed to get task list", error);
    }
  };

  useEffect(() => {
    const currentUserId = abUserInfo?.id;
    const prevId = prevTaskUserIdRef.current;

    if (currentUserId === prevId && prevId !== undefined) {
      console.warn(
        "[Home useEffect] ⚠️ id 未变化但 effect 被触发！可能是 React StrictMode 或组件重新挂载导致",
      );
      return;
    }

    prevTaskUserIdRef.current = currentUserId;
    const handleGetTasks = () => {
      getTasks();
    };
    handleGetTasks();
  }, [abUserInfo?.id]);

  const handleAddPoints = (taskItem: { rewardPoints?: number; taskCode: string }) => {
    if (showRewardToast) {
      return;
    }
    const text =
      taskItem.taskCode === "DAILY_GIFT"
        ? "Feeding submitted !"
        : taskItem.taskCode === "CHECK_IN"
          ? "Checked-in !"
          : "Reward claimed successfully";
    const currentPetStatus = petInfo?.petStatus;
    // 只有当蛋孵化之后，才需要切换动画
    if (Number(currentPetStatus) >= 20) {
      setPetInfo((prev) => {
        if (!prev) {
          return null;
        }
        return {
          ...prev,
          petStatus: taskItem.taskCode === "DAILY_GIFT" ? 101 : 102,
        };
      });
    }
    if (taskItem.rewardPoints) {
      setRewardToastInfo({
        text: text,
        points: taskItem.rewardPoints,
      });
      setShowRewardToast(true);
    }
    const timer = setTimeout(() => {
      setShowRewardToast(false);
      setRewardToastInfo(null);
      clearTimeout(timer);
      if (Number(currentPetStatus) >= 20) {
        // 直接更新 petInfo
        handleUpdatePetInfo(false);
      }
    }, 5_000);
  };

  const handleClickTask = async (taskItem: TaskItem) => {
    if (!abUserInfo?.id) {
      setOpenConnectWalletGuideSheet(true);
      return;
    }
    if (taskItem?.rewardStatus === 20) {
      toast.success(t("taskCompletedTip"));
      return;
    }

    if (taskItem.taskCode === "HATCHING_PET" && taskItem.rewardStatus == null) {
      if (isMinting) return;
      if (!isConnected || !address) {
        connect?.();
        return;
      }
      if (chainId !== undefined && chainId !== BEAR_NFT.chainId) {
        try {
          await switchChain(BEAR_NFT.chainId);
          // toast.success(t("chainSwitchSuccess"));
        } catch (error: unknown) {
          const err = error as { code?: number; message?: string };
          if (err?.code === 4001) {
            toast.error(t("chainSwitchRejectedByUser"));
          } else {
            toast.error(t("chainSwitchFailed"));
            console.error("Switch chain error:", error);
          }
          return;
        }
      }

      setIsMinting(true);
      try {
        let toastId = toast.loading(t("petMinting"));
        let txResult = false;
        let txHash = "";
        let receipt: Awaited<
          ReturnType<NonNullable<typeof publicClient>["waitForTransactionReceipt"]>
        > | null = null;
        try {
          const data = encodeFunctionData({
            abi: BEAR_NFT.ABI,
            functionName: "mint",
          });

          const hash = await sendTransaction({
            to: BEAR_NFT.address as `0x${string}`,
            data,
            chainId: BEAR_NFT.chainId,
          });
          txHash = hash;
          console.log(">>> Transaction hash:", hash);
          toast.dismiss(toastId);
          toast.success(t("petTxSend", { hash: truncateString(hash, 4, 6) }));

          if (publicClient) {
            toastId = toast.loading(t("petTxPending"));
            try {
              receipt = await publicClient.waitForTransactionReceipt({
                hash,
                timeout: 30_000, // 30秒超时
              });

              if (receipt.status === "success") {
                toast.success(t("petTxConfirmed"));
                txResult = true;
              } else {
                toast.error(t("petTxReverted"));
                console.error("Transaction reverted. Receipt:", receipt);
              }
            } catch (receiptError) {
              console.warn("Failed to wait for receipt, but transaction was sent:", receiptError);
              toast.dismiss(toastId);
              toast.success(t("petTxSend", { hash: truncateString(hash, 4, 6) }));
            } finally {
              toast.dismiss(toastId);
            }
          }
        } catch (error: unknown) {
          toast.dismiss(toastId);
          console.error("Mint error:", error);
          toast.error(t("petMintFailed"), {
            duration: 2000,
          });
        }
        if (txResult && receipt) {
          const blockNumber = receipt.blockNumber;
          let tokenId: bigint | null = null;

          if (receipt.logs && receipt.logs.length > 0) {
            for (const log of receipt.logs) {
              try {
                const decodedLog = decodeEventLog({
                  abi: BEAR_NFT.ABI,
                  data: log.data,
                  topics: log.topics,
                });

                if (
                  decodedLog.eventName === "MintSuccess" &&
                  decodedLog.args &&
                  "tokenId" in decodedLog.args
                ) {
                  tokenId = decodedLog.args.tokenId as bigint;
                  break;
                }
              } catch {
                continue;
              }
            }
          }

          console.log(">>> Block number:", blockNumber);
          console.log(">>> Token ID:", tokenId?.toString());

          try {
            await mint.update({
              txHash,
              blockNumber: blockNumber.toString() || "",
              tokenId: tokenId?.toString() || "",
            });
            toast.success(t("petHatchSuccess"));
            await getTasks();
            handleUpdatePetInfo(false);
            await sleep(5_000);
          } catch (err) {
            console.error("err", err);
            toast.error(t("petHatchFailed"));
          }
        }
      } finally {
        setIsMinting(false);
      }
      return;
    }

    // 高级签到：先向固定地址转固定数量 BNB，链上确认成功后再调用后端记录任务
    if (taskItem.taskCode === "SUPPER_CHECK_IN" && taskItem.rewardStatus == null) {
      if (!isConnected || !address) {
        setOpenConnectWalletGuideSheet(true);
        return;
      }
      if (chainId !== undefined && chainId !== BEAR_NFT.chainId) {
        try {
          // 尝试切换到目标链
          await switchChain(BEAR_NFT.chainId);
          // toast.success(t("chainSwitchSuccess"));
        } catch (error: unknown) {
          const err = error as { code?: number; message?: string };
          if (err?.code === 4001) {
            toast.error(t("chainSwitchRejectedByUser"));
          } else {
            toast.error(t("chainSwitchFailed"));
            console.error("Switch chain error:", error);
          }
          return;
        }
      }
      if (!SUPPER_CHECK_IN_TO || !SUPPER_CHECK_IN_AMOUNT) {
        toast.error("高级签到配置缺失，请联系管理员");
        return;
      }
      let value;
      try {
        value = parseEther(SUPPER_CHECK_IN_AMOUNT);
      } catch {
        toast.error("高级签到金额配置错误，请联系管理员");
        return;
      }

      let toastId = toast.loading("Submitting BNB transfer...");
      let txHash = "";
      let txSucceeded = false;
      try {
        const hash = await sendTransaction({
          to: SUPPER_CHECK_IN_TO,
          value,
          chainId: BEAR_NFT.chainId,
        });
        txHash = hash;
        toast.dismiss(toastId);
        toast.success("Transaction sent");

        if (publicClient) {
          toastId = toast.loading("Waiting for confirmation...");
          try {
            const receipt = await publicClient.waitForTransactionReceipt({
              hash,
              timeout: 30_000,
            });
            if (receipt.status === "success") {
              txSucceeded = true;
              toast.success("Transfer confirmed");
            } else {
              toast.error("Transfer reverted on-chain");
            }
          } catch (err) {
            console.warn("Failed to wait for transfer receipt", err);
            toast.error("Failed to confirm transfer, please check later");
          } finally {
            toast.dismiss(toastId);
          }
        }
      } catch (err) {
        toast.dismiss(toastId);
        console.error("SUPPER_CHECK_IN transfer failed", err);
        toast.error("Transfer failed, please try again");
      }

      if (!txSucceeded) {
        return;
      }

      try {
        // 先把链上转账信息发送给后端记录
        await transfer.create({
          toAddress: SUPPER_CHECK_IN_TO,
          amount: SUPPER_CHECK_IN_AMOUNT,
          txHash,
          token: "BNB",
          chain: "BSC",
        });

        // 再标记任务完成并刷新任务 / 积分
        await task.complete({
          taskCode: taskItem.taskCode,
          tweetUrl: "",
        });
        await getTasks();
        handleAddPoints(taskItem);
        abUserInfo?.updateUserInfo();
      } catch (error) {
        const errorData = (error as any)?.response?.data;
        toast.error(errorData?.data || tCommon("unknownError"));
      }
      return;
    }
    if (taskItem?.rewardStatus === 10) {
      await task.claim({
        taskCode: taskItem.taskCode,
        tweetUrl: "",
      });
      getTasks();
      handleAddPoints(taskItem);
      abUserInfo?.updateUserInfo();
      return;
    }
    if (taskItem.taskCode === "DAILY_GIFT") {
      setCurrentTaskCode(taskItem.taskCode);
      if (abUserInfo?.xid) {
        setOpenFeedTaskGuideSheet(true);
      } else {
        setOpenConnectXGuideDialog(true);
      }
    } else {
      if (taskItem.completedCount === taskItem.maxCompletion) {
        toast.success(t("taskCompletedTip"));
        return;
      }
      if (taskItem.taskCode === "FOLLOW_US" && !abUserInfo?.xid) {
        toast.error(t("connectXTip"));
        setOpenConnectXGuideDialog(true);
        return;
      }
      if (taskItem.taskCode === "FOLLOW_ABDAO" && !abUserInfo?.xid) {
        toast.error(t("connectXTip"));
        setOpenConnectXGuideDialog(true);
        return;
      }
      if (taskItem.taskCode === "FOLLOW_US") {
        setCurrentTaskCode(taskItem.taskCode);
        openLinkSafely("https://x.com/AwkwardBearfi");
        // 如果当前任务已经是 pending 状态，就不用后续的逻辑了
        if (taskItem.rewardStatus === 0) {
          return;
        }
        await sleep(2_000);
      }
      if (taskItem.taskCode === "FOLLOW_ABDAO") {
        setCurrentTaskCode(taskItem.taskCode);
        openLinkSafely("https://x.com/ABDAO_Global");
        // 如果当前任务已经是 pending 状态，就不用后续的逻辑了
        if (taskItem.rewardStatus === 0) {
          return;
        }
        await sleep(2_000);
      }
      if (taskItem.taskCode === "JOIN_TELEGRAM") {
        openLinkSafely("https://t.me/AwkwardBear_Official");
      }
      task
        .complete({
          taskCode: taskItem.taskCode,
          tweetUrl: "",
        })
        .then(() => {
          getTasks();
        })
        .then(() => {
          // 只有每日任务是立即结算的
          if (taskItem.taskType === "DAILY") {
            handleAddPoints(taskItem);
          }
        })
        .catch((error) => {
          const errorData = error?.response?.data;
          toast.error(errorData?.data || tCommon("unknownError"));
        });
    }
  };

  const handleTwitterConnect = async () => {
    if (!abUserInfo?.id) {
      toast.error(tCommon("userNotFound"));
      return;
    }

    setOpenConnectXGuideDialog(false);
    // 在本地存一个标识，避免重复认证
    localStorage.setItem("twitter_connect_flag", "true");
    // 使用 NextAuth 的 signIn 触发 Twitter 登录
    // callbackUrl 设置为当前页面，登录成功后会跳转回来
    const url = new URL(window.location.href);
    url.searchParams.set("auth", "twitter");
    // 只使用 pathname + search，避免包含完整 URL 导致的问题
    if (isTelegramMobileWebView()) {
      markTelegramXReturn(url);
      const startUrl = getTelegramTwitterAuthStartUrl(url);
      openOAuthLinkOutsideTelegram(startUrl);
    } else if (isTelegramWebView()) {
      const res = await signIn("twitter", {
        callbackUrl: url.pathname + url.search,
        redirect: false,
      });
      if (res?.url) {
        window.location.href = res.url;
      }
    } else {
      signIn("twitter", {
        callbackUrl: url.pathname + url.search,
      });
    }
  };

  const handleSubmitXPost = (link: string) => {
    // 校验 link 是否为合法的 https 链接
    try {
      const url = new URL(link);
      if (url.protocol !== "https:") {
        toast.error(tCommon("invalidLink"));
        return;
      }
    } catch {
      toast.error(tCommon("invalidLink"));
      return;
    }

    // 调用 task.complete 完成任务
    task
      .complete({
        taskCode: currentTaskCode,
        tweetUrl: link,
      })
      .then(() => {
        // toast.success("Task completed successfully");
        getTasks();
        setOpenFeedTaskGuideSheet(false);
      })
      .then(() => {
        handleAddPoints({
          taskCode: currentTaskCode,
          rewardPoints: giftRewardDetails.rewardPoints,
        });
      })
      .catch((error) => {
        const errorData = error?.response?.data;
        toast.error(errorData?.data || tCommon("unknownError"));
      });
  };

  const handleSubmitFollowXLink = (link: string) => {
    console.log(">>> link", link);
    // 校验是否是合法的 X 链接，以 https://x.com/ 开头
    if (!link.startsWith("https://x.com/")) {
      toast.error(tCommon("invalidLink"));
      return;
    }
    // 调用 task.complete 完成任务
    task
      .complete({
        taskCode: currentTaskCode,
        tweetUrl: link,
      })
      .then(() => {
        toast.success(t("taskSuccessTip"));
        getTasks();
        setOpenFollowXGuideSheet(false);
      })
      .catch((error) => {
        const errorData = error?.response?.data;
        toast.error(errorData?.data || tCommon("unknownError"));
      });
  };

  const handleUpdatePetInfo = (updatePetResource: boolean = true) => {
    pet
      .get()
      .then((res) => {
        setPetInfo(res.data);
        console.log(">>> res.data", res.data);

        if (updatePetResource) {
          getPetResource();
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };
  useEffect(() => {
    console.log("telegramUserId", telegramUserInfo);
  }, [telegramUserInfo]);

  return (
    <div
      className="min-h-screen"
      // style={{
      //   backgroundImage: `url(${backgroundImage.src})`,
      //   backgroundSize: "100% auto",
      //   backgroundRepeat: "repeat",
      // }}
    >
      <Header />
      <main className="relative">
        {abUserInfo?.id && (
          <div className="absolute top-6 right-4 z-9">
            <PetStatus
              tasksList={taskList}
              handleClickTask={handleClickTask}
              giftRewardDetails={giftRewardDetails}
            />
          </div>
        )}
        <LatestFed className="pt-8 pl-4 relative z-1 -top-4" />
        <EggStatus
          className="mt-2"
          petInfo={petInfo}
          petResource={petResource}
          handleUpdatePetInfo={handleUpdatePetInfo}
        />
        {showRewardToast && (
          <div
            className="px-4 w-full flex justify-center h-[48px] z-2 absolute "
            style={{ transform: "translateY(-88px)" }}
          >
            <div
              className="w-[354px] flex justify-center items-center text-cyan-50 font-bold rounded-[8px]"
              style={{
                background: "#083344B2",
              }}
            >
              <span>{rewardToastInfo?.text}</span>
              <Image src={petHead} className="ml-2" alt="pet-head" width={24} height={24} />
              <span>+{rewardToastInfo?.points}</span>
            </div>
          </div>
        )}
        <div className="relative z-1 top-3">
          <Tasks
            taskList={taskList}
            handleClickTask={handleClickTask}
            giftRewardDetails={giftRewardDetails}
          />
        </div>
      </main>

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
          handleSubmit={handleSubmitXPost}
        />
      </Sheet>

      <Sheet open={openFollowXGuideSheet} onOpenChange={setOpenFollowXGuideSheet}>
        <FollowXGuideSheetContent handleSubmit={handleSubmitFollowXLink} />
      </Sheet>

      <Sheet open={openConnectWalletGuideSheet} onOpenChange={setOpenConnectWalletGuideSheet}>
        <ConnectWalletGuideSheetContent
          handleClickConnectWallet={() => {
            setOpenConnectWalletGuideSheet(false);
            connect?.();
          }}
        />
      </Sheet>

      <Dialog open={openConnectXGuideDialog} onOpenChange={setOpenConnectXGuideDialog}>
        <ConnectXGuideDialog
          handleCancel={() => setOpenConnectXGuideDialog(false)}
          handleClose={() => setOpenConnectXGuideDialog(false)}
          handleConnect={handleTwitterConnect}
        />
      </Dialog>
    </div>
  );
}
