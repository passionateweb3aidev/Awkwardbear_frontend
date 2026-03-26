"use client";

// 现在不再对 Telegram 环境做额外拦截或重定向，直接渲染子内容。
export default function TelegramGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
