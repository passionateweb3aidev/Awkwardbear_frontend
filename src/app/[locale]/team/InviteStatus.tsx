import { colors } from "@/assets/color";
import { TeamSummaryResponse } from "@/services/team";
import { useTranslations } from "next-intl";

export default function InviteStatus({ teamSummary }: { teamSummary: TeamSummaryResponse }) {
  const t = useTranslations("team");
  return (
    <div className="flex justify-between gap-4">
      <div
        className="flex-1 flex flex-col items-center justify-center rounded-2xl bg-cyan-50 h-[86px] border-1 border-cyan-600"
        style={{
          boxShadow: `2px 2px 0px 0px ${colors.cyan600}`,
        }}
      >
        <p
          className="font-baloo font-bold text-cyan-600 text-2xl"
          style={{ fontFamily: "var(--font-baloo)" }}
        >
          {teamSummary?.boundWalletCount || 0}
        </p>
        <p className="font-bold text-cyan-950 text-xs mt-2">{t("totalInvite")}</p>
      </div>

      <div
        className="flex-1 flex flex-col items-center justify-center rounded-2xl bg-amber-50 h-[86px] border-1 border-amber-600"
        style={{
          boxShadow: `2px 2px 0px 0px ${colors.amber500}`,
        }}
      >
        <p
          className="font-baloo font-bold text-amber-500 text-2xl"
          style={{ fontFamily: "var(--font-baloo)" }}
        >
          {teamSummary?.activeUserCount || 0}
        </p>
        <p className="font-bold text-amber-950 text-xs mt-2">{t("validInvited")}</p>
      </div>
    </div>
  );
}
