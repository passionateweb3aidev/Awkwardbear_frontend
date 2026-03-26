"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface ITelegramUser {
  userId: number | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
}

interface ITelegramContextType {
  user: ITelegramUser;
  isReady: boolean;
}

const TelegramContext = createContext<ITelegramContextType | undefined>(undefined);

function getTelegramSourceChannel() {
  // 1. 优先检查 Telegram 环境
  if (window?.Telegram?.WebApp?.initDataUnsafe) {
    const tgParams = window.Telegram.WebApp.initDataUnsafe;
    if (tgParams?.start_param) {
      return tgParams.start_param; // 返回 TG 推广参数，如 "channel_A"
    }
  }
  // 2. 检查普通 H5 URL 参数
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("utm_source")) {
    return urlParams.get("utm_source");
  }
  // 3. 也可以定义自定义参数，如 ?channel=xxx
  if (urlParams.has("channel")) {
    return urlParams.get("channel");
  }
  return "organic"; // 默认自然流量
}

export function useTelegram() {
  const context = useContext(TelegramContext);
  if (context === undefined) {
    throw new Error("useTelegram must be used within a TelegramProvider");
  }
  return context;
}

const MAX_RETRY_COUNT = 3;
const RETRY_INTERVAL = 500;

function parseTelegramUser(): ITelegramUser | null {
  const webApp = window?.Telegram?.WebApp;

  if (!webApp || !webApp.initDataUnsafe) {
    return null;
  }

  const user = webApp.initDataUnsafe.user;

  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    username: user.username ?? null,
    firstName: user.first_name,
    lastName: user.last_name ?? null,
    avatar: user.photo_url ?? null,
  };
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ITelegramUser>({
    userId: null,
    username: null,
    firstName: null,
    lastName: null,
    avatar: null,
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let retryCount = 0;
    let timeoutId: NodeJS.Timeout | null = null;

    const checkTelegram = () => {
      const telegramUser = parseTelegramUser();
      const webApp = window?.Telegram?.WebApp;

      if (webApp) {
        // 强制扩展 Mini App 到全高
        webApp.expand?.();
        // 禁用垂直滑动关闭（可选，看需求，但通常有助于减少滚动时的缩放感）
        webApp.disableVerticalSwiping?.();
      }

      if (telegramUser) {
        setUser(telegramUser);
        setIsReady(true);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        return;
      }

      // 如果没找到，且未达到最大重试次数，则继续检测
      if (retryCount < MAX_RETRY_COUNT) {
        retryCount++;
        timeoutId = setTimeout(() => {
          checkTelegram();
        }, RETRY_INTERVAL);
      } else {
        // 达到最大重试次数，停止检测
        setIsReady(true);
      }
    };

    // 开始检测
    checkTelegram();

    // 清理函数
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // 当获取到 tgUser 后，要上报流量渠道
  useEffect(() => {
    if (!isReady) {
      return;
    }
    const tgChannel = getTelegramSourceChannel();

    if (!tgChannel) {
      return;
    }
    window?.gtag?.("set", {
      source: tgChannel,
      medium: "telegram",
    });
    window?.gtag?.("event", "tg_channel", {
      tg_channel: tgChannel,
    });
  }, [isReady]);

  return <TelegramContext.Provider value={{ user, isReady }}>{children}</TelegramContext.Provider>;
}
