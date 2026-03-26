"use client";

import Image from "next/image";
import petHead from "@/assets/icon/home-pet-head.png";
import headerUser from "@/assets/icon/header-user.png";
import { truncateString } from "@/utils/string";
import { RankUser as IRankUser } from "@/services/ranking";

export default function RankItem({
  rankItem,
  handleClickRankItem,
}: {
  rankItem: IRankUser;
  handleClickRankItem: (rankItem: IRankUser) => void;
}) {
  return (
    <div
      className={`flex justify-between bg-cyan-50 rounded-[16px] p-2 box-content border border-cyan-300`}
      onClick={() => handleClickRankItem(rankItem)}
    >
      <div className="flex items-center">
        <span
          className="font-bold text-cyan-500 text-2xl font-baloo"
          style={{ fontFamily: "var(--font-baloo)" }}
        >
          {rankItem.rank}
        </span>
        <div className="ml-3 border-2 border-cyan-300 rounded-full w-[40px] h-[40px] overflow-hidden">
          <Image
            src={rankItem?.photoUrl?.startsWith("http") ? rankItem?.photoUrl : headerUser}
            alt="avatar"
            width={36}
            height={36}
            className="w-[36px] h-[36px] rounded-full"
            unoptimized
          />
        </div>
        <div className="flex flex-col justify-center ml-2">
          <p
            className="font-baloo font-bold text-cyan-800"
            style={{ fontFamily: "var(--font-baloo)" }}
          >
            @{truncateString(rankItem?.username || rankItem?.walletAddress || "-", 4, 4)}
          </p>
          <p className="font-medium text-cyan-600 text-[10px]">
            {truncateString(rankItem?.walletAddress || "-", 6, 4)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <Image src={petHead} alt="pet" className="w-[24px]" />
        <span
          className="font-bold font-baloo text-cyan-600 ml-1 text-lg"
          style={{ fontFamily: "var(--font-baloo)" }}
        >
          {rankItem.totalPoints}
        </span>
      </div>
    </div>
  );
}
