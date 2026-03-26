import { ABUserContext } from "@/providers/WalletAuthSync";
import { user } from "@/services";
import { useContext, useEffect, useMemo, useRef, useState } from "react";

const DISPLAY_COUNT = 3; // 默认展示3条
const CAROUSEL_INTERVAL = 3000; // 轮播间隔（毫秒）

export default function LatestFed({ className }: { className?: string }) {
  const abUserInfo = useContext(ABUserContext);
  const [fedList, setFedList] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevUserIdRef = useRef<string | undefined>(undefined);
  const carouselTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevFedListLengthRef = useRef<number>(0);

  useEffect(() => {
    const currentUserId = abUserInfo?.id;
    const prevId = prevUserIdRef.current;

    if (currentUserId === prevId && prevId !== undefined) {
      console.warn(
        "[LatestFed useEffect] ⚠️ id 未变化但 effect 被触发！可能是 React StrictMode 或组件重新挂载导致",
      );
      return;
    }

    prevUserIdRef.current = currentUserId;

    const getUserBarInfo = async () => {
      const { data } = await user.bar().catch(() => {
        return { data: [] };
      });
      setFedList(data);
      // 重置索引
      setCurrentIndex(0);
      prevFedListLengthRef.current = data.length;
    };
    getUserBarInfo();
  }, [abUserInfo?.id]);

  // 当 fedList 长度变化时重置索引
  useEffect(() => {
    if (prevFedListLengthRef.current !== fedList.length && fedList.length > 0) {
      prevFedListLengthRef.current = fedList.length;
      // 使用 setTimeout 避免同步 setState
      setTimeout(() => {
        setCurrentIndex(0);
      }, 0);
    }
  }, [fedList.length]);

  // 计算显示的项目
  const displayItems = useMemo(() => {
    if (fedList.length === 0) {
      return [];
    }

    // 从 currentIndex 开始取 DISPLAY_COUNT 条
    const items: string[] = [];
    for (let i = 0; i < DISPLAY_COUNT; i++) {
      const index = (currentIndex + i) % fedList.length;
      items.push(fedList[index]);
    }
    return items;
  }, [fedList, currentIndex]);

  // 轮播逻辑
  useEffect(() => {
    // 清除之前的定时器
    if (carouselTimerRef.current) {
      clearInterval(carouselTimerRef.current);
    }

    // 如果 fedList 长度小于等于 DISPLAY_COUNT，不需要轮播
    if (fedList.length <= DISPLAY_COUNT) {
      return;
    }

    // 设置轮播定时器
    carouselTimerRef.current = setInterval(() => {
      setIsAnimating(true);

      // 先让最上面的项向上滑出，然后更新索引
      setTimeout(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % fedList.length;

          // 动画结束后重置状态
          setTimeout(() => {
            setIsAnimating(false);
          }, 100);

          return nextIndex;
        });
      }, 500); // 等待动画完成
    }, CAROUSEL_INTERVAL);

    // 清理函数
    return () => {
      if (carouselTimerRef.current) {
        clearInterval(carouselTimerRef.current);
      }
    };
  }, [fedList]);

  return (
    <div
      className={`flex flex-col-reverse relative overflow-hidden ${className}`}
      style={{
        backgroundImage: "linear-gradient(180deg, rgba(0, 0, 0, 0.51), transparent)",
        minHeight: `${DISPLAY_COUNT * 40}px`, // 确保容器高度固定
      }}
    >
      {displayItems.map((text, index) => {
        // 反转索引：最下面的是 index 0（最新的），最上面的是 index DISPLAY_COUNT-1（最旧的）
        const isBottomItem = index === 0; // 直接判断 index 0，因为 flex-col-reverse 会让 index 0 显示在最下面

        return (
          <p
            key={`fed-${currentIndex}-${index}`}
            className="rounded-2xl w-fit px-2 py-1 mb-1 text-white font-medium text-[10px]"
            style={{
              background: "rgba(2, 6, 23, 0.4)",
              backdropFilter: "blur(20px)",
              transition:
                isAnimating && isBottomItem
                  ? "transform 0.6s ease-in-out, opacity 0.6s ease-in-out"
                  : "none",
              transform: isAnimating && isBottomItem ? "translateY(100%)" : "translateY(0)",
              opacity: isAnimating && isBottomItem ? 0 : 1,
            }}
          >
            <span>{text}</span>
            {/* <span className="text-cyan-300">
              {truncateString(fedInfo.address, 4, 4)}
            </span>
            <span> just fed their pet !</span> */}
          </p>
        );
      })}
    </div>
  );
}
