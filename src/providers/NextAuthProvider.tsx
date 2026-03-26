"use client";

import { auth } from "@/services/auth";
import { getAccessToken, setTokenPair } from "@/services/token";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useRef } from "react";

function isTwitterBindCallback(url: URL): boolean {
  return url.searchParams.get("auth") === "twitter" || url.searchParams.get("tgXReturn") === "1";
}

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function attemptedKey(providerAccountId: string): string {
  return `abpet:x-login-synced:${providerAccountId}`;
}

function hasAttempted(providerAccountId: string): boolean {
  if (!canUseSessionStorage()) return false;
  return window.sessionStorage.getItem(attemptedKey(providerAccountId)) === "1";
}

function markAttempted(providerAccountId: string): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(attemptedKey(providerAccountId), "1");
}

function removeAttempted(providerAccountId: string): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(attemptedKey(providerAccountId));
}

/**
 * NextAuth Session Provider 包装组件
 * 当 Twitter 登录成功后，自动调用后端 API 获取 token
 */
export function NextAuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider basePath="/bff/auth">
      <TwitterAuthSync>{children}</TwitterAuthSync>
    </SessionProvider>
  );
}

/**
 * Twitter 登录同步组件
 * 监听 NextAuth session，当检测到 Twitter 登录成功时，调用后端 API
 *
 * 流程：
 * 1. NextAuth 处理 Twitter OAuth 流程，获取 access_token
 * 2. 当检测到 Twitter 登录成功时，使用 access_token 调用后端 /auth/x API
 * 3. 后端返回应用的 JWT token，保存到本地
 */
function TwitterAuthSync({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    // 只在客户端执行
    if (typeof window === "undefined") return;

    const currentUrl = new URL(window.location.href);

    // X 绑定回调交给 WalletAuthSync 处理，避免这里提前清理 URL 或覆盖当前平台 token。
    if (isTwitterBindCallback(currentUrl)) {
      return;
    }

    // 关键点：NextAuth 的 /bff/auth/callback/twitter 是 API Route，
    // 页面不会在该路由渲染，所以不能依赖它来触发同步。
    // 我们在“回跳页面”（callbackUrl）上检测到 session 已 authenticated 后同步一次即可。
    // 如果用户当前未登陆平台账户，就不处理后续的绑定 推特 流程
    if (!getAccessToken()) {
      return;
    }

    // 如果已经通过 NextAuth 登录，且还没有保存应用 token，且未处理过
    if (status === "authenticated" && session?.accessToken && !hasProcessedRef.current) {
      hasProcessedRef.current = true;

      const providerAccountId = session.providerAccountId || "twitter";
      if (hasAttempted(providerAccountId)) {
        return;
      }
      markAttempted(providerAccountId);

      // 调用后端 API 进行登录
      // 使用 NextAuth 获取的 Twitter access_token 作为 code 参数
      // 注意：如果后端需要原始的 OAuth code，可能需要修改后端 API 或使用不同的流程
      const redirectUri = window.location.origin + window.location.pathname;

      auth
        .loginWithX({
          code: session.accessToken, // 使用 NextAuth 获取的 access_token
          state: session.providerAccountId || "",
          redirectUri,
        })
        .then((res) => {
          if (res.data?.accessToken && res.data?.refreshToken) {
            // 保存应用 token
            setTokenPair({
              accessToken: res.data.accessToken,
              refreshToken: res.data.refreshToken,
            });

            // 清理 URL 中的标记参数（例如 auth=twitter）
            const url = new URL(window.location.href);
            url.searchParams.delete("auth");
            router.replace(url.pathname + url.search + url.hash);
          }
        })
        .catch((err) => {
          console.error("[TwitterAuthSync] Failed to login with backend API:", err);
          removeAttempted(providerAccountId);
          hasProcessedRef.current = false; // 失败后重置，允许重试
        });
    }
  }, [session, status, router]);

  return <>{children}</>;
}
