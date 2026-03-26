import { useParams } from "next/navigation";

/**
 * 获取当前语言环境
 * @returns 当前语言，默认为 'en'
 */
export function useCurrentLocale(): "en" | "zh" {
  const params = useParams();
  const locale = params?.locale as string;
  return locale === "zh" ? "zh" : "en";
}

/**
 * 根据当前语言选择对应的字段值
 * @param zhValue 中文字段值
 * @param enValue 英文字段值
 * @param locale 当前语言环境，默认为 'en'
 * @returns 根据语言环境返回对应的字段值
 */
export function getLocalizedField(
  zhValue: string,
  enValue: string,
  locale: "en" | "zh" = "en",
): string {
  return locale === "zh" ? zhValue : enValue;
}

/**
 * Hook: 根据当前语言选择对应的字段值
 * @param zhValue 中文字段值
 * @param enValue 英文字段值
 * @returns 根据当前语言环境返回对应的字段值
 */
export function useLocalizedField(zhValue: string, enValue: string): string {
  const locale = useCurrentLocale();
  return getLocalizedField(zhValue, enValue, locale);
}

/**
 * 判断当前语言是否为中文
 * @param locale 语言代码，可选。如果不提供，则从 URL params 中获取
 * @returns 如果是中文返回 true，否则返回 false
 */
export function isZhLocale(locale?: string): boolean {
  if (locale) {
    return locale.toLowerCase() === "zh" || locale.toLowerCase().startsWith("zh-");
  }

  // 如果没有提供 locale，尝试从浏览器环境获取
  if (typeof window !== "undefined") {
    // 从 URL 路径中获取 locale（例如：/zh/home 或 /en/home）
    const pathname = window.location.pathname;
    const localeMatch = pathname.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)/);
    if (localeMatch) {
      const pathLocale = localeMatch[1].toLowerCase();
      return pathLocale === "zh" || pathLocale.startsWith("zh-");
    }

    // 从浏览器语言设置获取
    const browserLang =
      navigator.language || (navigator as Navigator & { userLanguage: string }).userLanguage;
    if (browserLang) {
      return browserLang.toLowerCase() === "zh" || browserLang.toLowerCase().startsWith("zh-");
    }
  }

  return false;
}

/**
 * Hook: 判断当前语言是否为中文
 * @returns 如果是中文返回 true，否则返回 false
 */
export function useIsZh(): boolean {
  const locale = useCurrentLocale();
  return isZhLocale(locale);
}
