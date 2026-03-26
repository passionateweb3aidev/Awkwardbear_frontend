"use client";

import { colors } from "@/assets/color";
import { RankUser as IRankUser } from "@/services/ranking";
import RankItem from "./RankItem";

export default function RankList({
  rankList,
  className = "",
  handleClickRankItem,
}: {
  rankList: IRankUser[];
  className?: string;
  handleClickRankItem: (rankItem: IRankUser) => void;
}) {
  return (
    <div
      className={`bg-cyan-100 rounded-t-[24px] p-4 pt-2 pb-7 ${className}`}
      style={{
        border: `1px solid ${colors.cyan950}`,
        boxShadow: `0px -2px 0px 0px ${colors.cyan950}`,
        borderBottom: "none",
      }}
    >
      {rankList.map((rankItem) => (
        <div key={rankItem.id} className="mt-2">
          <RankItem rankItem={rankItem} handleClickRankItem={handleClickRankItem} />
        </div>
      ))}
    </div>
  );
}
