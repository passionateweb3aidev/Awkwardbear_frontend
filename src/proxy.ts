import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export function proxy(request: NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  // 匹配所有路径，除了以下内容：
  // - api routes
  // - bff routes (NextAuth 等前端 API)
  // - _next (Next.js 内部文件)
  // - _vercel (Vercel 内部文件)
  // - 静态文件 (*.svg, *.png, etc..)
  matcher: ["/((?!api|bff|_next|_vercel|.*\\..*).*)"],
};
