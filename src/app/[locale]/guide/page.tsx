"use client";

import { memo, useEffect } from "react";
import { useRouter } from "@/i18n/routing";

const Page = () => {
  const router = useRouter();

  useEffect(() => {
    // Telegram 进来此引导页时，自动重定向到当前语言的 home 页面
    router.replace("/home");
  }, [router]);

  return null;
};

export default memo(Page);
