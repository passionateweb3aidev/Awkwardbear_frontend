"use client";

import { useState } from "react";
import StatusAndRewardTab from "./components/StatusAndRewardTab";
import StatusAndRewardList from "./components/StatusAndRewardList";
import {
  TeamCommonItem,
  TeamInfoResponse,
  TeamPointsResponse,
  TeamSummaryResponse,
} from "@/services/team";

export type tabKey = "status" | "rewards";

export default function StatusAndReward({
  className = "",
  teamInfo,
  teamPoints,
}: {
  teamInfo: TeamInfoResponse;
  teamPoints: TeamPointsResponse;
  className?: string;
}) {
  const [activeTab, setActiveTab] = useState<tabKey>("status");

  const handleClickStatusAndReward = (item: TeamCommonItem & { [key: string]: unknown }) => {
    console.log(item);
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="w-full px-8 mt-2">
        <StatusAndRewardTab activeTab={activeTab} onChange={setActiveTab} />
      </div>
      <div className="w-full">
        <StatusAndRewardList
          teamInfo={teamInfo}
          teamPoints={teamPoints}
          activeKey={activeTab}
          handleClickStatusAndReward={handleClickStatusAndReward}
        />
      </div>
    </div>
  );
}
