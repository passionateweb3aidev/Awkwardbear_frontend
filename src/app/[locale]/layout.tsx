import backgroundImage from "@/assets/icon/home-bg.png";
import { GaPageView } from "@/components/GaPageView";
import TelegramGuard from "@/components/TelegramGuard";
import { VConsoleInstance } from "@/components/VConsole";
import { routing } from "@/i18n/routing";
import { NextAuthProvider } from "@/providers/NextAuthProvider";
import { TelegramProvider } from "@/providers/TelegramProvider";
import { Web3Provider } from "@/providers/Web3Provider";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Baloo_2, Geist, Geist_Mono, Quicksand } from "next/font/google";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Script from "next/script";
import { Toaster } from "react-hot-toast";
import "../globals.css";
import ConditionalNavbarLayout from "./components/ConditionalNavbarLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Awkward Bear",
  description:
    "Awkward Bear is an attention-economy platform. Users raise and interact with a virtual Awkward Bear, complete tasks, and participate in community activities. Through ongoing interaction and social resonance, time and attention are transformed into verifiable on-chain value, with rewards distributed in USD1.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const gaId = process.env.NEXT_PUBLIC_GA4_ID;
  console.log(">>> gaId", gaId);

  // 验证语言是否在支持的列表中
  if (!routing.locales.includes(locale as "en" | "zh")) {
    notFound();
  }

  // 获取当前语言的翻译消息
  const messages = await getMessages();
  // 与官方 Next 示例一致：传 cookie 给 Web3Provider，用于 cookieToInitialState 恢复连接状态
  const headersList = await headers();
  const cookie = headersList.get("cookie");

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${baloo.variable} ${quicksand.variable} antialiased w-full min-w-[320px] max-w-2xl mx-auto overflow-y-auto`}
        style={{
          backgroundImage: `url(${backgroundImage.src})`,
          backgroundSize: "100% auto",
          backgroundRepeat: "repeat",
          height: "100dvh", // 使用动态视口高度，解决移动端 Chrome 浏览器 UI 导致的高度计算问题
        }}
      >
        {/* telegram web app sdk */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        {/* Google tag (gtag.js) */}
        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){window.dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', { send_page_view: false });
              `}
            </Script>
          </>
        ) : null}
        <NextIntlClientProvider messages={messages}>
          <NextAuthProvider>
            <TelegramProvider>
              <Web3Provider>
                {gaId ? <GaPageView measurementId={gaId} /> : null}
                {process.env.NODE_ENV !== "production" && <VConsoleInstance />}
                <TelegramGuard>
                  <ConditionalNavbarLayout>{children}</ConditionalNavbarLayout>
                </TelegramGuard>
              </Web3Provider>
            </TelegramProvider>
          </NextAuthProvider>
        </NextIntlClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
