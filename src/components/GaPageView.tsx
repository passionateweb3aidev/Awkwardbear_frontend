"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function GaPageView({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams?.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;
    // 让 GA4 在“首次互动/首次访问”时就能拿到来源归因：
    // - 推荐使用标准 UTM：utm_source/utm_medium/utm_campaign...
    // - 兼容自定义 channel 参数（等价于 utm_source）
    const urlParams = new URLSearchParams(query ?? "");
    const campaignSource = urlParams.get("utm_source") ?? urlParams.get("channel") ?? undefined;

    const config: Record<string, unknown> = {
      page_path: pagePath,
      // 明确传 page_location，保证 collect 请求里的 dl 含完整 query，便于 GA4 解析 UTM
      page_location:
        typeof window !== "undefined" ? `${window.location.origin}${pagePath}` : pagePath,
    };

    if (campaignSource) config.campaign_source = campaignSource;

    window?.gtag?.("config", measurementId, config);
  }, [measurementId, pathname, searchParams]);

  return null;
}
