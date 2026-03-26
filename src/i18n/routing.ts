import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  // 支持的语言列表
  locales: ["en", "zh"],

  // 默认语言
  defaultLocale: "en",

  // 禁用自动语言检测，始终使用默认语言 en
  localeDetection: false,
});

// 创建国际化导航助手
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
