"use client";

import Image from "next/image";
import backgroundImage from "@/assets/icon/home-bg.png";
import Header from "@/components/Header";
import task from "@/assets/icon/leaderboard-task.png";
import TopRanking from "./components/TopRanking";
import RankList from "./components/RankList";
import { useContext, useEffect, useRef, useState } from "react";
import { ranking } from "@/services";
import { RankUser as IRankUser } from "@/services/ranking";
import { ABUserContext } from "@/providers/WalletAuthSync";
import avatarTemplate from "@/assets/icon/team-avatar-template.png";
import { truncateString } from "@/utils/string";
import petHead from "@/assets/icon/home-pet-head.png";
import { colors } from "@/assets/color";
import { useTranslations } from "next-intl";

export default function Leaderboard() {
  const abUserInfo = useContext(ABUserContext);
  const prevUserIdRef = useRef<string | undefined>(undefined);
  const t = useTranslations("leaderboard");
  const [topRankingList, setTopRankingList] = useState<IRankUser[]>([]);
  const [rankingList, setRankingList] = useState<IRankUser[]>([]);
  const [myRanking, setMyRanking] = useState<IRankUser | null>(null);

  useEffect(() => {
    const currentUserId = abUserInfo?.id;
    const prevId = prevUserIdRef.current;
    // 如果 id 没有变化，记录警告
    if (currentUserId === prevId && prevId !== undefined) {
      console.warn(
        "[Leaderboard useEffect] ⚠️ id 未变化但 effect 被触发！可能是 React StrictMode 或组件重新挂载导致",
      );
      return;
    }

    prevUserIdRef.current = currentUserId;

    ranking.get(currentUserId || "").then((res) => {
      const { top, myRanking } = res.data;
      setTopRankingList(top.slice(0, 3));
      setRankingList(top.slice(3, 50));
      if (myRanking) {
        setMyRanking(myRanking);
      }
    });
  }, [abUserInfo?.id]);

  const handleClickRankItem = (rankItem: IRankUser) => {
    console.log(rankItem);
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
          <Image src={task} alt="team" className="w-[54px] h-[54px] mx-auto" />
          <p
            className="font-bold text-cyan-950 text-center mt-2"
            style={{ fontFamily: "var(--font-baloo)" }}
          >
            {t("title")}
          </p>
          {/* <p className="font-medium text-cyan-700 text-center mt-1 text-xs">{t("desc")}</p> */}

          <TopRanking topUsers={topRankingList} />
        </div>

        {rankingList && rankingList.length > 0 && (
          <div className="relative z-1 top-3">
            <RankList rankList={rankingList} handleClickRankItem={handleClickRankItem} />
          </div>
        )}

        {abUserInfo?.id && myRanking && (
          <div className="pb-4">
            <div className="flex items-center justify-between bg-cyan-500 h-[82px] px-4">
              <div className="flex items-center">
                <span
                  className="font-bold text-cyan-50 text-3xl font-baloo"
                  style={{ fontFamily: "var(--font-baloo)" }}
                >
                  {myRanking?.rank}
                </span>
                <div className="ml-3 border-2 border-cyan-300 rounded-full w-[40px] h-[40px] overflow-hidden">
                  <Image
                    src={
                      myRanking?.photoUrl?.startsWith("http") ? myRanking?.photoUrl : avatarTemplate
                    }
                    alt="avatar"
                    width={36}
                    height={36}
                    className="w-[36px] h-[36px] rounded-full"
                    unoptimized
                  />
                </div>
                <div className="flex flex-col justify-center ml-2">
                  <p
                    className="font-baloo font-bold text-cyan-50"
                    style={{ fontFamily: "var(--font-baloo)" }}
                  >
                    @{truncateString(myRanking?.username || myRanking?.walletAddress || "-", 4, 4)}
                  </p>
                  <p className="font-medium text-cyan-200 text-[10px]">
                    {truncateString(myRanking?.walletAddress || "-", 6, 4)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Image src={petHead} alt="pet" className="w-[24px]" />
                <span
                  className="font-bold font-baloo text-cyan-50 ml-1 text-lg"
                  style={{ fontFamily: "var(--font-baloo)" }}
                >
                  {myRanking?.totalPoints}
                </span>
                {/* <div
                  className="w-[64px] h-[32px] ml-2 bg-cyan-50 text-cyan-500 rounded-[16px] flex items-center justify-center text-xs font-bold font-baloo border border-cyan-950"
                  style={{
                    fontFamily: "var(--font-baloo)",
                    boxShadow: `2px 2px 0px 0px ${colors.cyan950}`,
                  }}
                >
                  Boost
                </div> */}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
