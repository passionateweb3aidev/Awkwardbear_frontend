"use client";

import { usePathname } from "@/i18n/routing";
import Navbar from "@/components/Navbar";
import { useEffect, useRef } from "react";

const NO_NAVBAR_ROUTES = ["/profile/history", "/guide"];

export default function ConditionalNavbarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const shouldShowNavbar = !NO_NAVBAR_ROUTES.some((route) => {
    return pathname === route;
  });

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].pageY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const scrollTop = scrollContainer.scrollTop;
      const scrollHeight = scrollContainer.scrollHeight;
      const height = scrollContainer.clientHeight;
      const currentY = e.touches[0].pageY;
      const deltaY = currentY - startY;

      // 如果已经滚动到顶部，且继续向上滑动，阻止默认行为
      if (scrollTop <= 0 && deltaY > 0) {
        e.preventDefault();
        return false;
      }

      // 如果已经滚动到底部，且继续向下滑动，阻止默认行为
      if (scrollTop + height >= scrollHeight - 1 && deltaY < 0) {
        e.preventDefault();
        return false;
      }
    };

    scrollContainer.addEventListener("touchstart", handleTouchStart, { passive: true });
    scrollContainer.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      scrollContainer.removeEventListener("touchstart", handleTouchStart);
      scrollContainer.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return (
    <div
      className="relative overflow-y-auto"
      style={{
        height: "100dvh", // 使用动态视口高度，解决移动端 Chrome 浏览器 UI 导致的高度计算问题
      }}
    >
      <div
        ref={scrollContainerRef}
        className={`h-full overflow-y-auto ${shouldShowNavbar ? "pb-[80px]" : ""}`}
        style={{
          overscrollBehavior: "none",
          overscrollBehaviorY: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {children}
      </div>
      {shouldShowNavbar && (
        <div className="absolute bottom-0 left-0 right-0 h-[80px] z-19">
          <Navbar />
        </div>
      )}
    </div>
  );
}
