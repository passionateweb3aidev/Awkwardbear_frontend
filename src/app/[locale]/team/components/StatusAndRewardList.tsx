import { colors } from "@/assets/color";
import { tabKey } from "../StatusAndReward";
import StatusAndRewardItem from "./StatusAndRewardItem";
import {
  TeamCommonItem,
  TeamInfoResponse,
  TeamPointsResponse,
  TeamSummaryResponse,
} from "@/services/team";
import { useTranslations } from "next-intl";

export default function StatusAndRewardList({
  teamInfo,
  teamPoints,
  className = "",
  handleClickStatusAndReward,
  activeKey,
}: {
  className?: string;
  teamInfo: TeamInfoResponse;
  teamPoints: TeamPointsResponse;
  handleClickStatusAndReward: (item: TeamCommonItem & { [key: string]: unknown }) => void;
  activeKey: tabKey;
}) {
  const statusAndRewardList = activeKey === "status" ? teamInfo : teamPoints;
  const tCommon = useTranslations("common");

  return (
    <div
      className={`bg-cyan-100 rounded-t-[24px] p-4 pt-2 pb-7 ${className} min-h-[calc(100vh-540px)]`}
      style={{
        border: `1px solid ${colors.cyan950}`,
        boxShadow: `0px -2px 0px 0px ${colors.cyan950}`,
        borderBottom: "none",
      }}
    >
      {statusAndRewardList.map(
        (
          item: TeamCommonItem & {
            [key: string]: unknown;
          },
        ) => (
          <div key={item.id} className="mt-2">
            <StatusAndRewardItem
              activeKey={activeKey}
              item={item}
              handleClickStatusAndReward={handleClickStatusAndReward}
            />
          </div>
        ),
      )}
      {statusAndRewardList?.length === 0 && (
        <div className="flex items-center justify-center h-full mt-2">
          <p className="text-cyan-600">{tCommon("noData")}</p>
        </div>
      )}
    </div>
  );
}
