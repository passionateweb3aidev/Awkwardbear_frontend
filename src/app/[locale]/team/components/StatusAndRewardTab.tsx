import { colors } from "@/assets/color";
import { tabKey } from "../StatusAndReward";
import { useTranslations } from "next-intl";

export default function StatusAndRewardTab({
  activeTab = "status" as tabKey,
  className = "",
  onChange,
}: {
  activeTab: tabKey;
  className?: string;
  onChange?: (tab: tabKey) => void;
}) {
  const t = useTranslations("team");
  const tabs = [
    {
      key: "status",
      label: t("tabStatus"),
    },
    {
      key: "rewards",
      label: t("tabRewards"),
    },
  ];

  return (
    <div
      className={`flex w-full h-[40px] rounded-t-[16px] overflow-hidden ${className}`}
      style={{
        border: `1px solid ${colors.cyan950}`,
        boxShadow: `0px -2px 0px 0px ${colors.cyan950}`,
      }}
    >
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.key;
        const isFirst = index === 0;

        return (
          <button
            key={tab.key}
            onClick={() => onChange?.(tab.key as tabKey)}
            className={`
              flex-1 flex items-center justify-center
              ${isActive ? "bg-cyan-300" : "bg-cyan-100"}
            `}
            style={
              isFirst
                ? {
                    borderRight: `1px solid ${colors.cyan950}`,
                  }
                : {
                    borderLeft: `1px solid ${colors.cyan950}`,
                  }
            }
          >
            <span
              className={`font-baloo text-xl font-bold ${
                isActive ? "text-cyan-950" : "text-cyan-600"
              }`}
              style={{
                fontFamily: "var(--font-baloo)",
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
