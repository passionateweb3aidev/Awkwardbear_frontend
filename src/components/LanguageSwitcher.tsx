"use client";

import { usePathname, useRouter } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { useSearchParams } from "next/navigation";

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const currentLocale = params.locale as string;

  const handleLanguageChange = (newLocale: string) => {
    const queryString = searchParams?.toString() || "";
    const href = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(href, { locale: newLocale });
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleLanguageChange("en")}
        className={`px-3 py-1 rounded ${
          currentLocale === "en"
            ? "bg-black text-white dark:bg-white dark:text-black"
            : "bg-gray-200 text-black dark:bg-gray-700 dark:text-white"
        }`}
      >
        English
      </button>
      <button
        onClick={() => handleLanguageChange("zh")}
        className={`px-3 py-1 rounded ${
          currentLocale === "zh"
            ? "bg-black text-white dark:bg-white dark:text-black"
            : "bg-gray-200 text-black dark:bg-gray-700 dark:text-white"
        }`}
      >
        中文
      </button>
    </div>
  );
}
