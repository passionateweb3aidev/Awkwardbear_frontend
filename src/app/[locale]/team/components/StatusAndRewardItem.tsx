import avatarTemplate from "@/assets/icon/team-avatar-template.png";
import activeStatus from "@/assets/icon/team-status-active.png";
import sleepingStatus from "@/assets/icon/team-status-sleeping.png";
import { TeamCommonItem } from "@/services/team";
import { truncateString } from "@/utils/string";
import { getDaysAgo } from "@/utils/time";
import Image from "next/image";
import { tabKey } from "../StatusAndReward";

export default function StatusAndRewardItem({
  item,
  handleClickStatusAndReward,
  activeKey,
}: {
  item: TeamCommonItem & {
    [key: string]: unknown;
  };
  handleClickStatusAndReward: (
    item: TeamCommonItem & {
      [key: string]: unknown;
    },
  ) => void;
  activeKey: tabKey;
}) {
  const daysAgo = getDaysAgo(item.createTime);

  return (
    <div
      className={`flex justify-between bg-cyan-50 rounded-[16px] px-4 py-2 box-content border border-cyan-300`}
      onClick={() => handleClickStatusAndReward(item)}
    >
      <div className="flex">
        <Image
          src={item?.photoUrl?.startsWith("http") ? item?.photoUrl : avatarTemplate}
          alt="avatar"
          className="w-[40px] h-[40px] rounded-full"
        />
        <div className="flex flex-col justify-center ml-2">
          <p
            className="font-baloo font-bold text-cyan-800"
            style={{ fontFamily: "var(--font-baloo)" }}
          >
            @{truncateString(item?.username || item?.walletAddress || "-", 4, 4)}
          </p>
          {item.createTime ? (
            <p className="font-medium text-cyan-600 text-[10px]">
              Joined {daysAgo > 0 ? `${daysAgo} ${daysAgo === 1 ? "day" : "days"} ago` : "today"}
            </p>
          ) : (
            <p className="font-medium text-cyan-600 text-[10px]">
              {truncateString(item?.walletAddress || "", 4, 4)}
            </p>
          )}
        </div>
      </div>

      {activeKey === "status" ? (
        <div className="flex items-center">
          <Image
            src={item.activeStatus === 1 ? activeStatus : sleepingStatus}
            alt="active"
            className="w-[24px] h-[24px]"
          />
          <span
            className={`font-bold ml-1 text-xs ${item.activeStatus === 1 ? "text-cyan-600" : "text-slate-500"}`}
          >
            {item.activeStatus === 1 ? "Active" : "Sleeping"}
          </span>
        </div>
      ) : (
        <div className="flex flex-col justify-center">
          {/* <div className="flex items-center justify-end">
            <Image src={petHead} alt="pet" className="w-[24px]" />
            <span
              className="font-bold font-baloo text-cyan-600 ml-1 text-lg"
              style={{ fontFamily: "var(--font-baloo)" }}
            >
              {(item?.points || 0) as number}
            </span>
          </div> */}
          <div className="px-[6px] py-1 text-cyan-50 bg-cyan-950 rounded-sm text-xs mt-1">
            <span className="font-bold text-cyan-300">+ {(item?.points || 0) as number}</span> to
            You
          </div>
        </div>
      )}
    </div>
  );
}
