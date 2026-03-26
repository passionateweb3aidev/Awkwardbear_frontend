"use client";

import { useEffect, useRef } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const reloadingRef = useRef(false);

  useEffect(() => {
    if (reloadingRef.current) {
      return;
    }
    reloadingRef.current = true;

    // 禁用自动刷新逻辑，因为它会中断钱包连接过程
    /*
    const isTelegram = typeof window !== "undefined" && window?.Telegram?.WebApp;
    const handleFullscreenChanged = () => {
      console.log("handleFullscreenChanged", window?.Telegram?.WebApp?.isFullscreen);
      if (!window?.Telegram?.WebApp?.isFullscreen) {
        reloadingRef.current = true;
        setTimeout(() => {
          window.location.reload();
        }, 300);
      }
    };
    if (isTelegram) {
      (
        window?.Telegram?.WebApp as any
      ).onEvent("fullscreenChanged", handleFullscreenChanged);
    }
    return () => {
      if (isTelegram) {
        (
          window?.Telegram?.WebApp as any
        ).offEvent("fullscreenChanged", handleFullscreenChanged);
      }
    };
    */
  }, []);

  return children;
}
