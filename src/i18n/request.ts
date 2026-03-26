import { getRequestConfig } from "next-intl/server";
import en from "./dictionaries/en";
import zh from "./dictionaries/zh";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // 从请求中获取当前的语言设置
  let locale = await requestLocale;

  // 确保语言在支持的列表中
  if (!locale || !routing.locales.includes(locale as "en" | "zh")) {
    locale = routing.defaultLocale;
  }

  const messagesMap = {
    en,
    zh,
  };

  return {
    locale,
    messages: messagesMap[locale as keyof typeof messagesMap],
  };
});
