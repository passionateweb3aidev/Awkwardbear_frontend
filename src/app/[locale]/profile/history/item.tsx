import Image from "next/image";
import XIcon from "@/assets/icon/profile-history-X.png";
import miningIcon from "@/assets/icon/profile-history-mining.png";
import inviteIcon from "@/assets/icon/profile-history-invite.png";
import { UserPointItem } from "@/services/user";
import dayjs from "dayjs";
import petDailyCheck from "@/assets/icon/home-pet-daily-check.png";
import petGift from "@/assets/icon/home-pet-gift.png";
import petTaskJoinTg from "@/assets/icon/home-task-join-tg.png";
import petTaskFollowX from "@/assets/icon/connect-X.png";
import petTaskFollowAbDao from "@/assets/icon/connect-X.png";
import petConnectWallet from "@/assets/icon/connect-wallet.png";

const MissionItem = ({ item }: { item: UserPointItem }) => {
  console.log("item", item);

  const getTaskIcon = (taskCode: string) => {
    switch (taskCode) {
      case "BIND_WALLET":
        return petDailyCheck;
      case "CHECK_IN":
        return petDailyCheck;
      case "DAILY_GIFT":
        return petGift;
      case "FOLLOW_US":
        return petTaskFollowX;
      case "FOLLOW_ABDAO":
        return petTaskFollowX;
      case "HATCHING_PET":
        return petConnectWallet;
      case "JOIN_TELEGRAM":
        return petTaskJoinTg;
      default:
        return petDailyCheck;
    }
  };

  return (
    <div className="p-4 bg-amber-50 rounded-lg border border-amber-300 flex">
      <div>
        <Image
          src={getTaskIcon(item.taskCode)}
          alt="X"
          width={24}
          height={24}
          className="rounded-sm"
        />
      </div>
      <div className="flex-1 flex justify-center ml-3">
        <div className="flex-1">
          <div className="flex items-center">
            <span
              className="font-bold text-amber-800 font-baloo text-sm"
              style={{ fontFamily: "var(--font-baloo)" }}
            >
              {item?.pointDesc || ""}
            </span>
            {/* <span className="font-bold text-amber-500 text-xs ml-1">{
              item?.createTime ? dayjs(item?.createTime).format("YYYY-MM-DD HH:mm") : ""
            }</span> */}
          </div>
          {/* {item?.taskCode === "DAILY_GIFT" && (
            <div className="flex items-center mt-2">
              <span className="rounded-sm px-1 py-0.5 bg-amber-200 text-amber-600 text-[10px]">
                Likes ≥ 200
              </span>
              <span className="rounded-sm px-1 py-0.5 bg-lime-200 text-lime-600 text-[10px] ml-1">
                Comments ≥ 200
              </span>
              <span className="rounded-sm px-1 py-0.5 bg-cyan-200 text-cyan-600 text-[10px] ml-1">
                Views ≥ 200
              </span>
            </div>
          )} */}
          <p className="font-medium text-amber-600 text-[10px] mt-4">
            Settled At: {item?.createTime ? dayjs(item?.createTime).format("YYYY-MM-DD HH:mm") : ""}
          </p>
        </div>
        <div
          className="font-bold text-amber-600 font-baloo"
          style={{ fontFamily: "var(--font-baloo)" }}
        >
          +{item?.changePoints || 0}
        </div>
      </div>
    </div>
  );
};

const InviteItem = ({ item }: { item: UserPointItem }) => {
  return (
    <div className="p-4 bg-lime-50 rounded-lg border border-lime-300 flex">
      <div>
        <Image src={inviteIcon} alt="invite" width={24} height={24} className="rounded-sm" />
      </div>
      <div className="flex-1 flex justify-center ml-3">
        <div className="flex-1">
          <div className="flex items-center">
            <span
              className="font-bold text-lime-800 font-baloo text-sm"
              style={{ fontFamily: "var(--font-baloo)" }}
            >
              {item?.pointDesc || ""}
            </span>
          </div>

          <p className="font-medium text-lime-600 text-[10px] mt-4">
            {item?.createTime ? dayjs(item?.createTime).format("YYYY-MM-DD HH:mm") : ""}
          </p>
        </div>
        <div
          className="font-bold text-lime-600 font-baloo"
          style={{ fontFamily: "var(--font-baloo)" }}
        >
          +{item?.changePoints || 0}
        </div>
      </div>
    </div>
  );
};

const MiningItem = ({ item }: { item: UserPointItem }) => {
  return (
    <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-300 flex">
      <div>
        <Image src={miningIcon} alt="mining" width={24} height={24} className="rounded-sm" />
      </div>
      <div className="flex-1 flex justify-center ml-3">
        <div className="flex-1">
          <div className="flex items-center">
            <span
              className="font-bold text-cyan-800 font-baloo text-sm"
              style={{ fontFamily: "var(--font-baloo)" }}
            >
              {item?.pointDesc || ""}
            </span>
          </div>

          <p className="font-medium text-cyan-600 text-[10px] mt-4">
            {item?.createTime ? dayjs(item?.createTime).format("YYYY-MM-DD HH:mm") : ""}
          </p>
        </div>
        <div
          className="font-bold text-cyan-600 font-baloo"
          style={{ fontFamily: "var(--font-baloo)" }}
        >
          +{item?.changePoints || 0}
        </div>
      </div>
    </div>
  );
};

export default function PointHistoryItem({ item }: { item: UserPointItem }) {
  const { pointType } = item;
  if (pointType === "TASK_REWARD") {
    return <MissionItem item={item} />;
  } else if (pointType === "INVITE_REWARD") {
    return <InviteItem item={item} />;
  } else if (pointType === "MINING_REWARD") {
    return <MiningItem item={item} />;
  }
  return null;
}
