"use client";

import { useMemo } from "react";
import Image from "next/image";
import crownGold from "@/assets/icon/leaderboard-crown-gold.png";
import crownBlue from "@/assets/icon/leaderboard-crown-blue.png";
import crownSilver from "@/assets/icon/leaderboard-crown-silver.png";
import petHead from "@/assets/icon/home-pet-head.png";
import headerUser from "@/assets/icon/header-user.png";
import { truncateString } from "@/utils/string";
import { colors } from "@/assets/color";
import { RankUser as IRankUser } from "@/services/ranking";
import leaderboardChampion from "@/assets/icon/leaderboard-champion.png";
import rankArrowUp1 from "@/assets/icon/rank-arrow-up-1.png";
import rankArrowUp2 from "@/assets/icon/rank-arrow-up-2.png";
import rankArrowUp3 from "@/assets/icon/rank-arrow-up-3.png";

const RANK_STYLES = {
  1: {
    crownImage: crownGold,
    avatarBorderColor: "border-amber-300",
    bgColor: "bg-amber-100",
    rankTextColor: "text-amber-400",
    rewardChangeBgColor: "bg-amber-200",
    borderColor: "border-amber-500",
    boxShadowColor: colors.amber500,
    boxHeight: "h-[200px]",
  },
  2: {
    crownImage: crownSilver,
    avatarBorderColor: "border-slate-300",
    bgColor: "bg-slate-100",
    rankTextColor: "text-slate-400",
    rewardChangeBgColor: "bg-slate-200",
    borderColor: "border-slate-500",
    boxShadowColor: colors.slate500,
    boxHeight: "h-[170px]",
  },
  3: {
    crownImage: crownBlue,
    avatarBorderColor: "border-cyan-400",
    bgColor: "bg-cyan-100",
    rankTextColor: "text-cyan-400",
    rewardChangeBgColor: "bg-cyan-200",
    borderColor: "border-cyan-500",
    boxShadowColor: colors.cyan500,
    boxHeight: "h-[160px]",
  },
} as const;

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

export default function TopRanking({ topUsers }: { topUsers: IRankUser[] }) {
  const sortedTopUsers = useMemo(() => {
    if (topUsers.length < 3) return topUsers;
    return [topUsers[1], topUsers[0], topUsers[2]].filter(Boolean);
  }, [topUsers]);

  return (
    <div className="mt-8 flex gap-2">
      {sortedTopUsers.map((userRankInfo) => {
        const rank = userRankInfo.rank as 1 | 2 | 3;
        const styles = RANK_STYLES[rank] || RANK_STYLES[3];

        // 格式化地址显示
        const displayAddress = truncateString(userRankInfo?.walletAddress || "-", 6, 4);

        return (
          <div key={userRankInfo.id} className="flex flex-col items-center flex-1 justify-end">
            <div className="w-full flex flex-col items-center">
              <div
                className={`relative border-4 ${styles.avatarBorderColor} rounded-full w-[54px] h-[54px]`}
              >
                <Image
                  src={
                    userRankInfo?.photoUrl?.startsWith("http") ? userRankInfo?.photoUrl : headerUser
                  }
                  alt="avatar"
                  width={46}
                  height={46}
                  className="w-[46px] h-[46px] rounded-full"
                  unoptimized
                />
                <Image
                  src={styles.crownImage}
                  alt="pet"
                  className="absolute -top-[15px] -right-[10px] w-[30px]"
                />
              </div>

              <div className="mt-2 text-cyan-950 text-center">
                <p
                  className="font-baloo font-bold  text-xs "
                  style={{ fontFamily: "var(--font-baloo)" }}
                >
                  {truncateString(
                    userRankInfo?.username || userRankInfo?.walletAddress || "-",
                    6,
                    4,
                  )}
                </p>
                <p className="font-medium text-[10px]">{displayAddress}</p>
              </div>
            </div>

            <div
              className={`relative mt-4 rounded-[8px] ${styles.bgColor} w-full py-3 ${styles.borderColor} border ${styles.boxHeight}`}
              style={{
                boxShadow: `2px 2px 0px 0px ${styles.boxShadowColor}`,
              }}
            >
              {userRankInfo.rank === 1 && (
                <Image
                  src={leaderboardChampion}
                  alt="leaderboard champion"
                  className="absolute w-full top-[40%] -translate-y-1/2"
                  unoptimized
                />
              )}
              <div className="relative z-1 flex flex-col justify-between h-full">
                <p
                  className={`font-bold text-center font-baloo ${styles.rankTextColor} text-[40px]`}
                  style={{ fontFamily: "var(--font-baloo)" }}
                >
                  {userRankInfo.rank}
                </p>
                <div className="flex flex-col items-center">
                  <Image src={petHead} alt="pet" className="w-[24px]" />
                  <p
                    className="font-bold text-center font-baloo text-[20px] tracking-wide"
                    style={{
                      fontFamily: "var(--font-baloo)",
                      color: colors.cyan50,
                      textShadow: TEXT_STROKE_SHADOW,
                    }}
                  >
                    {userRankInfo.totalPoints}
                  </p>
                  <div
                    className={`${styles.rewardChangeBgColor} mt-1 min-w-[62px] rounded-full px-2 py-1 text-xs font-bold text-cyan-950 flex items-center justify-center`}
                  >
                    {userRankInfo.totalPoints > 0 ? "+" : "-"}
                    {userRankInfo.totalPoints}

                    {userRankInfo.rank === 1 ? (
                      <Image src={rankArrowUp1} alt="rank arrow up" className="w-[6px] ml-1" />
                    ) : userRankInfo.rank === 2 ? (
                      <Image src={rankArrowUp2} alt="rank arrow up" className="w-[6px] ml-1" />
                    ) : userRankInfo.rank === 3 ? (
                      <Image src={rankArrowUp3} alt="rank arrow up" className="w-[6px] ml-1" />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
