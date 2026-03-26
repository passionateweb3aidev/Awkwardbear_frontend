"use client";

import eggBeforeHatch from "@/assets/icon/egg-before-hatch.gif";
import eggCrackTipZh from "@/assets/icon/egg-crack-tip-zh.png";
import eggCrackTip from "@/assets/icon/egg-crack-tip.png";
import eggCrack from "@/assets/icon/egg-crack.gif";
import claimPetButtonZh from "@/assets/icon/home-claim-pet-button-zh.png";
import claimPetButton from "@/assets/icon/home-claim-pet-button.png";
import connectWalletWithTipZh from "@/assets/icon/home-connect-button-with-tip-zh.png";
import connectWalletWithTip from "@/assets/icon/home-connect-button-with-tip.png";
import petImageDefault from "@/assets/icon/home-pet-default.png";
import petImageFeeding from "@/assets/icon/home-pet-feeding.png";
import petImageFreeze from "@/assets/icon/home-pet-freeze.png";
import petImageHeart from "@/assets/icon/home-pet-heart.png";
import petImageMining from "@/assets/icon/home-pet-mining.png";
import petImagePatHead from "@/assets/icon/home-pet-pat-head.png";
import petImageRest from "@/assets/icon/home-pet-rest.png";
import petShakeBg from "@/assets/icon/home-pet-shake-bg.gif";
import petImageTired from "@/assets/icon/home-pet-tired.png";
import petImageWave from "@/assets/icon/home-pet-wave.png";
import progress0 from "@/assets/icon/home-progress-0.png";
import progress100 from "@/assets/icon/home-progress-100.png";
import progress20 from "@/assets/icon/home-progress-20.png";
import progress70 from "@/assets/icon/home-progress-70.png";
import progressFreeze from "@/assets/icon/home-progress-freeze.png";
import ConnectWalletGuideSheetContent from "@/components/ConnectWalletGuideSheetContent";
import { Sheet } from "@/components/ui/sheet";
import BEAR_NFT from "@/const/bearNFT";
import { useWalletConnect } from "@/contexts/WalletConnectContext";
import { useWalletTx } from "@/hooks/useWalletTx";
import { ABUserContext } from "@/providers/WalletAuthSync";
import { mint } from "@/services/mint";
import { pet, PetResponse } from "@/services/pet";
import { useIsZh } from "@/utils/i18n";
import { truncateString } from "@/utils/string";
import { sleep } from "@/utils/time";
import { useTranslations } from "next-intl";
import Image, { StaticImageData } from "next/image";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { decodeEventLog, encodeFunctionData } from "viem";
import DialogWithText from "./components/DialogWithText";
import { IPetResource } from "./page";

enum PetStatus {
  BeforeHatch = "Before hatch",
  Cracked = "Cracked",
  Shaking = "Shaking",
  Boring = "Boring",
  Freezing = "Freezing",
  Mining = "Mining",
  Tiring = "Tiring",
  Heart = "Heart",
  Shy = "Shy",
  Eating = "Eating",
  Gift = "Gift",
  Sleeping = "Sleeping",
}

export default function EggStatus({
  className = "",
  petInfo,
  petResource,
  handleUpdatePetInfo,
}: {
  className?: string;
  petInfo: PetResponse | null;
  petResource: IPetResource;
  handleUpdatePetInfo: () => void;
}) {
  const t = useTranslations("home");
  const { openModal, connect, isConnected, address } = useWalletConnect();
  const { sendTransaction, switchChain, publicClient } = useWalletTx();
  const [petStatus, setPetStatus] = useState<PetStatus>(PetStatus.BeforeHatch);
  const [petSp, setPetSp] = useState<number | undefined>(undefined);
  const [lastTouchTimestamp, setLastTouchTimestamp] = useState<number | undefined>(undefined);
  const [isTouching, setIsTouching] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const { chainId } = useWalletConnect();
  const abUserInfo = useContext(ABUserContext);
  const handleUpdateLastTouchTimestamp = (spentTime: string | undefined | null) => {
    if (!spentTime) {
      return;
    }
    const timestamp = new Date(spentTime).getTime();
    setLastTouchTimestamp(timestamp);
  };

  useEffect(() => {
    if (!petInfo?.petStatus) {
      return;
    }
    const updateData = () => {
      setPetSp(petInfo?.petSp);
      handleUpdateLastTouchTimestamp(petInfo?.spentTime);
    };
    updateData();
  }, [petInfo]);

  const handleSetPetStatus = (status: number | undefined, petSp: number | undefined) => {
    // setPetStatus(PetStatus.Shy);
    // return;
    if (status === undefined) {
      setPetStatus(PetStatus.BeforeHatch);
      return;
    }
    switch (status) {
      case 0:
        setPetStatus(PetStatus.BeforeHatch);
        return;
      case 10:
        setPetStatus(PetStatus.Cracked);
        return;
      case 20:
        setPetStatus(PetStatus.Sleeping);
        return;
      case 30:
        setPetStatus(PetStatus.Mining);
        return;
      case 40:
        setPetStatus(PetStatus.Tiring);
        return;
      case 50:
        setPetStatus(PetStatus.Freezing);
        return;
      case 101:
        setPetStatus(PetStatus.Gift);
        return;
      case 102:
        setPetStatus(PetStatus.Heart);
        return;
      default:
        setPetStatus(PetStatus.BeforeHatch);
        return;
    }
  };

  useEffect(() => {
    const updateData = () => {
      handleSetPetStatus(petInfo?.petStatus, petInfo?.petSp);
    };
    updateData();
  }, [petInfo?.petStatus, petInfo?.petSp]);

  const dialogText = useMemo(() => {
    switch (petStatus) {
      case PetStatus.BeforeHatch:
      case PetStatus.Cracked:
      case PetStatus.Shaking:
        return t("bindWalletTip");
      default:
        return null;
    }
  }, [petStatus, t]);

  const handleEggClick = useCallback(async () => {
    if (!petInfo?.petStatus) return;
    if (petInfo.petStatus === 10) {
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

          // 和后端确认后，前端不再主动调用 mint.update 接口更新 petStatus，而是等交易确认后由后端通过链上事件监听来更新状态
          // pet
          //   .update({
          //     petStatus: 10,
          //     txHash,
          //   })
          //   .catch();

          // 3. 可选：手动等待交易回执（如果 RPC 节点可用）
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
                // 和后端确认后，前端不再主动调用 mint.update 接口更新 petStatus，而是等交易确认后由后端通过链上事件监听来更新状态
                // pet
                //   .update({
                //     petStatus: 10,
                //     txHash,
                //   })
                //   .catch();
              }
            } catch (receiptError) {
              // 如果等待回执失败，但交易已发送，至少用户有 hash
              console.warn("Failed to wait for receipt, but transaction was sent:", receiptError);
              toast.dismiss();
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
          // 获取这笔交易确认的 blocknumber 和 mint 出来的 tokenId
          const blockNumber = receipt.blockNumber;
          let tokenId: bigint | null = null;

          // 从交易回执的日志中解析 MintSuccess 事件获取 tokenId
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
                // 忽略无法解码的日志（可能是其他合约的事件）
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
            setPetStatus(PetStatus.Shaking);
            await sleep(5_000);
          } catch (err) {
            console.error("err", err);
            toast.error(t("petHatchFailed"));
          }
        }
        handleUpdatePetInfo?.();
      } finally {
        setIsMinting(false);
      }
    } else if (petInfo.petStatus >= 20 && !isTouching) {
      // 当 petStatus > 20 时，click 就要触发抚摸操作
      // 如果距离上一次 touch 不足一分钟，则跳过
      // if (petInfo.petSp >= 20 && (!lastTouchTimestamp || Date.now() - lastTouchTimestamp < 60000)) {
      //   toast.error("Touch pet too frequently");
      //   return;
      // }
      try {
        setIsTouching(true);
        setPetStatus(PetStatus.Shy);
        const res = await pet.touch().catch(() => null);
        if (!res) {
          toast.error(t("petTouchFailed"));
          handleSetPetStatus(petInfo?.petStatus, petInfo?.petSp);
          return;
        }
        await sleep(5000);
        // 更新用户积分
        abUserInfo?.updateUserInfo();
        const newPetInfo = res?.data;
        setPetSp(newPetInfo.petSp);
        handleUpdateLastTouchTimestamp(newPetInfo.spentTime);
        handleSetPetStatus(newPetInfo.petStatus, newPetInfo.petSp);
      } finally {
        setIsTouching(false);
      }
    }
  }, [
    petInfo?.petStatus,
    petInfo?.petSp,
    isTouching,
    isMinting,
    chainId,
    sendTransaction,
    switchChain,
    publicClient,
    handleUpdatePetInfo,
    connect,
  ]);

  const buttonStyle = useMemo(
    () => ({
      left: "50%",
      transform: "translateX(-50%)",
    }),
    [],
  );

  const freezePetConnectWalletButton = useMemo(
    () => (
      <button
        type="button"
        className="absolute top-[200px] w-[240px] flex items-center justify-center"
        style={buttonStyle}
        onClick={() => connect?.()}
      >
        <Image
          src={connectWalletWithTip}
          alt="connect wallet"
          width={connectWalletWithTip.width}
          height={connectWalletWithTip.height}
          unoptimized
        />
      </button>
    ),
    [buttonStyle, connect],
  );

  const renderEggContent = useMemo(() => {
    switch (petStatus) {
      case PetStatus.BeforeHatch:
        return <BeforeHatch />;
      case PetStatus.Cracked:
        return <Cracked handleEggClick={() => null} />;
      case PetStatus.Shaking:
        return (
          <div className="relative">
            <Image
              src={petShakeBg}
              alt="pet shake bg"
              className="absolute w-[390px] h-[390px] left-0 top-0"
            />
            <PetContainer
              petImage={petImageWave}
              petSp={petSp}
              petResource={petResource.shake || petImageWave}
            />
          </div>
        );

      case PetStatus.Boring:
        return (
          <PetContainer
            petImage={petImageDefault}
            petSp={petSp}
            petResource={petResource.base || petImageDefault}
          />
        );
      case PetStatus.Freezing:
        return (
          <PetContainer
            petImage={petImageFreeze}
            bottomButton={freezePetConnectWalletButton}
            petSp={petSp}
            petResource={petResource.rest || petImageFreeze}
          />
        );
      case PetStatus.Mining:
        return (
          <PetContainer
            petImage={petImageMining}
            petImageClassName="relative right-5"
            petSp={petSp}
            petResource={petResource.mining || petImageMining}
          />
        );
      case PetStatus.Tiring:
        return (
          <PetContainer
            petImage={petImageTired}
            petSp={petSp}
            petResource={petResource.tired || petImageTired}
          />
        );
      case PetStatus.Sleeping:
        return (
          <PetContainer
            petImage={petImageRest}
            petSp={petSp}
            petResource={petResource.rest || petImageRest}
          />
        );
      case PetStatus.Gift:
        return (
          <PetContainer
            petImage={petImageHeart}
            petSp={petSp}
            petResource={petResource.gift || petImageHeart}
          />
        );
      case PetStatus.Heart:
        return (
          <PetContainer
            petImage={petImageHeart}
            petSp={petSp}
            petResource={petResource.heart || petImageHeart}
          />
        );
      case PetStatus.Shy:
        return (
          <div className="relative">
            <div className="absolute top-0 w-full flex items-center justify-center">
              <p
                className="text-center text-cyan-600 font-bold text-[32px] font-baloo animate-[slide-up-fade_1s_ease-out_forwards]"
                style={{
                  fontFamily: "var(--font-baloo)",
                }}
              >
                +50
              </p>
            </div>

            <PetContainer
              petImage={petImagePatHead}
              petSp={petSp}
              petResource={petResource.patHead || petImagePatHead}
            />
          </div>
        );
      case PetStatus.Eating:
        return (
          <PetContainer
            petImage={petImageFeeding}
            petSp={petSp}
            petResource={petResource.coffee || petImageFeeding}
          />
        );
      default:
        return null;
    }
  }, [petStatus, freezePetConnectWalletButton, petSp, petResource]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {dialogText ? (
        <DialogWithText
          text={dialogText}
          style={{
            width: "197px",
            height: "62px",
          }}
          textStyle={{ marginTop: "-12px" }}
        />
      ) : null}

      <div className="relative" onClick={handleEggClick}>
        {renderEggContent}
      </div>
    </div>
  );
}

function BeforeHatch() {
  const { connect } = useWalletConnect();
  const isZh = useIsZh();
  const [openConnectWalletGuideSheet, setOpenConnectWalletGuideSheet] = useState(false);

  return (
    <>
      <Image
        src={eggBeforeHatch}
        alt="egg"
        width={320}
        height={320}
        className="mt-8 w-[320px] h-[320px]"
        unoptimized
      />
      <button
        type="button"
        className="absolute top-[190px] w-[240px] flex items-center justify-center"
        style={{
          left: "50%",
          transform: "translateX(-50%)",
        }}
        onClick={() => setOpenConnectWalletGuideSheet(true)}
      >
        <Image
          src={isZh ? connectWalletWithTipZh : connectWalletWithTip}
          alt="connect wallet"
          width={connectWalletWithTip.width}
          height={connectWalletWithTip.height}
          unoptimized
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
  );
}

function Cracked({ handleEggClick }: { handleEggClick: () => void }) {
  const isZh = useIsZh();
  return (
    <>
      <Image
        src={eggCrack}
        alt="egg"
        width={320}
        height={320}
        className="mt-8 w-[320px] h-[320px]"
        unoptimized
      />
      <button
        type="button"
        className="absolute top-[269px] w-[240px] flex items-center justify-center"
        style={{
          left: "50%",
          transform: "translateX(-50%)",
        }}
        onClick={handleEggClick}
      >
        <Image
          src={isZh ? claimPetButtonZh : claimPetButton}
          alt="claim pet"
          width={claimPetButton.width}
          height={claimPetButton.height}
          unoptimized
        />
      </button>
      <p className="flex justify-center -mt-6">
        <Image src={isZh ? eggCrackTipZh : eggCrackTip} alt="egg crack tip" width={240} />
      </p>
    </>
  );
}

function PetContainer({
  petSp,
  petImage,
  petImageClassName = "",
  petResource,
  bottomButton,
}: {
  petSp: number | undefined;
  petImage: StaticImageData;
  petImageClassName?: string;
  petResource?: string | StaticImageData;
  bottomButton?: React.ReactNode;
}) {
  let progressImage = progressFreeze;
  if (petSp !== undefined) {
    if (petSp >= 100) {
      progressImage = progress100;
    } else if (petSp >= 80) {
      progressImage = progress70;
    } else if (petSp >= 30) {
      progressImage = progress20;
    } else if (petSp >= 0) {
      progressImage = progress0;
    }
  }

  return (
    <div className="relative">
      {progressImage && (
        <Image
          src={progressImage}
          alt="progress"
          width={progressImage.width}
          height={progressImage.height}
          className="absolute w-[40px] h-[180px] left-4 top-[70px]"
          unoptimized
        />
      )}
      <Image
        src={petResource || petImage}
        alt="pet"
        width={390}
        height={390}
        className={`w-[390px] h-[390px] ${petImageClassName}`}
        unoptimized
      />
      {bottomButton || null}
    </div>
  );
}
