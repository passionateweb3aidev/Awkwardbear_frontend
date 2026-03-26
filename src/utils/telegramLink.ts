import { envConfig } from "@/config/env";
import { getAccessToken } from "@/services/token";

const TELEGRAM_X_RETURN_PARAM = "tgXReturn";
const TELEGRAM_X_ACCESS_TOKEN_PARAM = "tgXAt";
const TELEGRAM_RETURN_FALLBACK_DELAY = 1200;

/**
 * 在 Telegram WebView 中安全地打开链接
 * 如果在 Telegram WebView 中，使用 Telegram.WebApp.openLink
 * 否则使用标准方法
 */
export function openLinkSafely(url: string): void {
  // 检测是否在 Telegram WebView 中
  if (typeof window !== "undefined" && window?.Telegram?.WebApp?.openLink) {
    // 在 Telegram WebView 中，使用 Telegram API
    (window.Telegram.WebApp as unknown as { openLink: (url: string) => void }).openLink(url);
  } else {
    // 不在 Telegram WebView 中，使用标准方法
    window.open(url, "_blank");
  }
}

/**
 * 检测是否在 Telegram WebView 中
 */
export function isTelegramWebView(): boolean {
  return typeof window !== "undefined" && !!window.Telegram?.WebApp;
}

/**
 * 检测是否在移动端 Telegram WebView 中
 */
export function isTelegramMobileWebView(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const telegramWebApp = window.Telegram?.WebApp;
  if (!telegramWebApp) {
    return false;
  }

  const platform = telegramWebApp.platform?.toLowerCase();
  if (platform === "android" || platform === "ios") {
    return true;
  }

  return /Android|iPhone|iPad|iPod|Mobile/i.test(window.navigator.userAgent);
}

function getTelegramMobilePlatform(): "android" | "ios" | null {
  if (typeof window === "undefined") {
    return null;
  }

  const platform = window.Telegram?.WebApp?.platform?.toLowerCase();
  if (platform === "android" || platform === "ios") {
    return platform;
  }

  const userAgent = window.navigator.userAgent;
  if (/Android/i.test(userAgent)) {
    return "android";
  }
  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return "ios";
  }

  return null;
}

/**
 * 在移动端 Telegram Mini App 中将 OAuth 链接交给系统外部浏览器处理，
 * 避免 X 授权页面继续在 Telegram WebView 内加载。
 */
export function openOAuthLinkOutsideTelegram(url: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const absoluteUrl = new URL(url, window.location.origin).toString();
  const telegramMobilePlatform = getTelegramMobilePlatform();

  if (telegramMobilePlatform && window.Telegram?.WebApp?.openLink) {
    window.Telegram.WebApp.openLink(
      absoluteUrl,
      telegramMobilePlatform === "android"
        ? { try_instant_view: false, try_browser: "chrome" }
        : { try_instant_view: false },
    );
    return;
  }

  window.location.assign(absoluteUrl);
}

export function markTelegramXReturn(url: URL): void {
  url.searchParams.set(TELEGRAM_X_RETURN_PARAM, "1");

  const accessToken = getAccessToken();
  if (!accessToken) {
    return;
  }

  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
  hashParams.set(TELEGRAM_X_ACCESS_TOKEN_PARAM, accessToken);
  url.hash = hashParams.toString();
}

export function shouldReturnToTelegramMiniApp(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return new URL(window.location.href).searchParams.get(TELEGRAM_X_RETURN_PARAM) === "1";
}

export function clearTelegramXReturnState(): void {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  const hadTelegramReturn = url.searchParams.has(TELEGRAM_X_RETURN_PARAM);
  const hadAuthMarker = url.searchParams.get("auth") === "twitter";

  if (!hadTelegramReturn && !hadAuthMarker) {
    return;
  }

  url.searchParams.delete(TELEGRAM_X_RETURN_PARAM);
  if (hadAuthMarker) {
    url.searchParams.delete("auth");
  }
  window.history.replaceState(null, "", url.toString());
}

export function getTelegramXBridgeAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return hashParams.get(TELEGRAM_X_ACCESS_TOKEN_PARAM);
}

export function clearTelegramXBridgeAccessToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
  if (!hashParams.has(TELEGRAM_X_ACCESS_TOKEN_PARAM)) {
    return;
  }

  hashParams.delete(TELEGRAM_X_ACCESS_TOKEN_PARAM);
  url.hash = hashParams.toString();
  window.history.replaceState(null, "", url.toString());
}

export function getTelegramMainMiniAppLink(startParam = "xbind"): string {
  const params = new URLSearchParams();
  params.set("startattach", startParam);
  return `https://t.me/${envConfig.telegramBotUsername}?${params.toString()}`;
}

export function getTelegramMainMiniAppDeepLink(startParam = "xbind"): string {
  const params = new URLSearchParams();
  params.set("domain", envConfig.telegramBotUsername);
  params.set("startattach", startParam);
  return `tg://resolve?${params.toString()}`;
}

export function getTelegramTwitterAuthStartUrl(callbackUrl: URL): string {
  if (typeof window === "undefined") {
    throw new Error("Telegram Twitter auth start URL can only be created in the browser.");
  }

  const pathSegments = callbackUrl.pathname.split("/").filter(Boolean);
  const locale = pathSegments[0] || "en";
  const startUrl = new URL(`/${locale}/twitter-auth-start`, window.location.origin);
  startUrl.searchParams.set(
    "callbackUrl",
    `${callbackUrl.pathname}${callbackUrl.search}${callbackUrl.hash}`,
  );
  return startUrl.toString();
}

export function returnToTelegramMiniApp(startParam = "xbind"): void {
  if (typeof window === "undefined") {
    return;
  }

  const deepLink = getTelegramMainMiniAppDeepLink(startParam);
  const fallbackLink = getTelegramMainMiniAppLink(startParam);

  let fallbackTimer: number | null = window.setTimeout(() => {
    window.location.replace(fallbackLink);
  }, TELEGRAM_RETURN_FALLBACK_DELAY);

  const clearFallback = () => {
    if (fallbackTimer !== null) {
      window.clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      clearFallback();
    }
  };

  window.addEventListener("pagehide", clearFallback, { once: true });
  document.addEventListener("visibilitychange", handleVisibilityChange, { once: true });

  window.location.href = deepLink;
}

/**
 * 手动发起 NextAuth Twitter OAuth，避免 next-auth/react 的 signIn() 对 OAuth
 * provider 直接在当前 WebView 中执行 window.location 跳转。
 */
export async function getTwitterOAuthAuthorizationUrl(callbackUrl: string): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("Twitter OAuth can only be started in the browser.");
  }

  const csrfResponse = await fetch("/bff/auth/csrf");
  if (!csrfResponse.ok) {
    throw new Error(`Failed to get CSRF token: ${csrfResponse.status}`);
  }

  const csrfData = (await csrfResponse.json()) as { csrfToken?: string };
  if (!csrfData.csrfToken) {
    throw new Error("CSRF token is missing from NextAuth response.");
  }

  const signInResponse = await fetch("/bff/auth/signin/twitter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      csrfToken: csrfData.csrfToken,
      callbackUrl,
      json: "true",
    }),
  });

  if (!signInResponse.ok) {
    throw new Error(`Failed to start Twitter OAuth: ${signInResponse.status}`);
  }

  const signInData = (await signInResponse.json()) as { url?: string };
  if (!signInData.url) {
    throw new Error("Twitter OAuth URL is missing from NextAuth response.");
  }

  return new URL(signInData.url, window.location.origin).toString();
}
