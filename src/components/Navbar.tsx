"use client";

import Image from "next/image";
import { Link, usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import navHomeActive from "@/assets/icon/nav-home-active.png";
import navHomeDefault from "@/assets/icon/nav-home-default.png";
import navWidgetActive from "@/assets/icon/nav-widget-active.png";
import navWidgetDefault from "@/assets/icon/nav-widget-default.png";
import navCupStarActive from "@/assets/icon/nav-cup-star-active.png";
import navCupStarDefault from "@/assets/icon/nav-cup-star-default.png";
import navUserActive from "@/assets/icon/nav-user-active.png";
import navUserDefault from "@/assets/icon/nav-user-default.png";
import { colors } from "@/assets/color";
import { useTranslations } from "next-intl";

const Navbar = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("common");
  const navItems = [
    {
      href: "/home",
      label: t("navbarHome"),
      iconActive: navHomeActive,
      iconDefault: navHomeDefault,
    },
    {
      href: "/team",
      label: t("navbarTeam"),
      iconActive: navWidgetActive,
      iconDefault: navWidgetDefault,
    },
    {
      href: "/leaderboard",
      label: t("navbarLeaderboard"),
      iconActive: navCupStarActive,
      iconDefault: navCupStarDefault,
    },
    {
      href: "/profile",
      label: t("navbarProfile"),
      iconActive: navUserActive,
      iconDefault: navUserDefault,
    },
  ];

  const isActive = (href: string) => {
    return pathname === href;
  };

  const withQueryParams = (href: string) => {
    if (!searchParams || searchParams.toString() === "") return href;
    return `${href}?${searchParams.toString()}`;
  };

  return (
    <nav
      className="h-full flex justify-between items-center rounded-t-2xl overflow-hidden"
      style={{
        backgroundColor: colors.cyan200,
        borderColor: colors.cyan950,
        borderTop: `1px solid ${colors.cyan950}`,
        boxShadow: `0px -2px 0px 0px ${colors.cyan950}`,
      }}
    >
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={withQueryParams(item.href)}
            className={`h-full flex-1 flex flex-col items-center justify-center py-2 rounded transition-colors ${
              active ? "bg-cyan-50" : "bg-transparent"
            }`}
          >
            <Image
              src={active ? item.iconActive : item.iconDefault}
              alt={item.label}
              width={32}
              height={32}
              className="mb-1"
            />
            <span className="text-xs font-bold text-cyan-900">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default Navbar;
