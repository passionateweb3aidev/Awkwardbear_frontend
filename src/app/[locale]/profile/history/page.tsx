"use client";

import Image from "next/image";
import { colors } from "@/assets/color";
import leftArrow from "@/assets/icon/header-left-arrow.png";
import { useRouter } from "@/i18n/routing";
import { useContext, useEffect, useCallback, useRef, useState } from "react";
import profileConst from "../const";
import { Button } from "@/components/ui/button";
import PointHistoryItem from "./item";
import { ABUserContext } from "@/providers/WalletAuthSync";
import { user } from "@/services";
import { UserPointItem } from "@/services/user";
import InfiniteScroll from "react-infinite-scroll-component";
import { useTranslations } from "next-intl";

interface IPagination {
  page: number;
  totalPage: number;
  pageSize: number;
  total: number;
}

export default function ProfileHistory() {
  const router = useRouter();
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const NAVBAR_TBAS = [
    {
      key: "",
      label: tCommon("all"),
    },
    {
      key: "TASK_REWARD",
      label: tCommon("mission"),
    },
    {
      key: "INVITE_REWARD",
      label: tCommon("invite"),
    },
    {
      key: "MINING_REWARD",
      label: tCommon("mining"),
    },
  ];

  const abUserInfo = useContext(ABUserContext);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeNavbarKey, setActiveNavbarKey] = useState<(typeof NAVBAR_TBAS)[number]["key"]>(
    NAVBAR_TBAS[0].key,
  );

  const [pagination, setPagination] = useState<IPagination>({
    page: 0,
    totalPage: 0,
    pageSize: 10,
    total: 0,
  });
  const [pointsList, setPointsList] = useState<UserPointItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const prevUserIdRef = useRef<string | undefined>(undefined);
  const prevActiveNavbarKeyRef = useRef<string>(NAVBAR_TBAS[0].key);
  const hasInitialFetchRef = useRef(false);

  // 获取积分历史数据
  const fetchPoints = useCallback(
    async (page: number, append: boolean = false) => {
      if (isLoading) return;

      setIsLoading(true);
      try {
        const activeTab = window.location.search.split("activeTab=")[1];
        const activeTabKey = activeTab
          ? activeTab === "mission"
            ? "TASK_REWARD"
            : activeTab === "invite"
              ? "INVITE_REWARD"
              : "MINING_REWARD"
          : "";
        const { data } = await user.points({
          page,
          pageSize: pagination.pageSize,
          pointType:
            // 如果没有初始请求，需要用 url 中的参数填充
            (hasInitialFetchRef.current ? prevActiveNavbarKeyRef.current : activeTabKey) as
              | "TASK_REWARD"
              | "INVITE_REWARD"
              | "MINING_REWARD"
              | "",
        });
        hasInitialFetchRef.current = true;

        setPagination((prev) => ({
          page: data.current,
          totalPage: data.pages,
          pageSize: prev.pageSize,
          total: data.total,
        }));

        if (append) {
          // 追加数据
          setPointsList((prev) => [...prev, ...data.records]);
        } else {
          // 替换数据
          setPointsList(data.records);
        }
      } catch (error) {
        console.error("Failed to fetch points:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, pagination.pageSize],
  );

  useEffect(() => {
    const activeTab = window.location.search.split("activeTab=")[1];
    console.log("activeTab", activeTab);
    if (activeTab) {
      setActiveNavbarKey(
        activeTab === "mission"
          ? "TASK_REWARD"
          : activeTab === "invite"
            ? "INVITE_REWARD"
            : "MINING_REWARD",
      );
    } else {
      setActiveNavbarKey(NAVBAR_TBAS[0].key);
    }
  }, []);

  useEffect(() => {
    const currentUserId = abUserInfo?.id;
    const prevId = prevUserIdRef.current;

    if (!currentUserId) {
      prevUserIdRef.current = currentUserId;
      return;
    }

    if (currentUserId === prevId && prevId !== undefined) {
      console.warn(
        "[Home useEffect] ⚠️ id 未变化但 effect 被触发！可能是 React StrictMode 或组件重新挂载导致",
      );
      return;
    }

    prevUserIdRef.current = currentUserId;
    fetchPoints(1, false);
  }, [abUserInfo?.id, fetchPoints]);

  useEffect(() => {
    if (prevActiveNavbarKeyRef.current !== activeNavbarKey) {
      prevActiveNavbarKeyRef.current = activeNavbarKey;
      fetchPoints(1, false);
    }
  }, [activeNavbarKey, fetchPoints]);

  // 加载更多数据
  const loadMore = () => {
    if (!isLoading && pagination.page >= 1 && pagination.page < pagination.totalPage) {
      fetchPoints(pagination.page + 1, true);
    }
  };

  useEffect(() => {
    // 页面进入动画：从右侧滑入
    requestAnimationFrame(() => {
      setIsAnimating(true);
    });
  }, []);

  const handleBack = () => {
    // 页面退出动画：向右滑出
    setIsAnimating(false);
    // 等待动画完成后导航
    setTimeout(() => {
      router.back();
    }, profileConst.ANIMATION_DURATION);
  };

  return (
    <div
      className={`min-h-screen font-quicksand bg-cyan-50 transition-transform duration-[${
        profileConst.ANIMATION_DURATION
      }ms] ease-in-out ${isAnimating ? "translate-x-0" : "translate-x-full"}`}
      style={{
        fontFamily: "var(--font-quicksand)",
      }}
    >
      <div
        className="w-full flex items-center justify-between px-4 py-2 rounded-b-2xl h-[56px] font-baloo"
        style={{
          backgroundColor: colors.cyan200,
          borderBottom: `4px solid ${colors.slate950}`,
          fontFamily: "var(--font-baloo)",
        }}
      >
        <Button variant="ghost" className="p-0 cursor-pointer" onClick={handleBack}>
          <Image src={leftArrow} alt="left arrow" width={24} height={24} />
        </Button>
        <span className="font-bold text-cyan-950 text-lg">{t("pointsHistory")}</span>
      </div>
      <main
        className="relative mt-3 font-quicksand"
        style={{
          fontFamily: "var(--font-quicksand)",
        }}
      >
        <div className="px-4 flex items-center justify-between h-[24px] leading-[24px]">
          {NAVBAR_TBAS.map((item) => {
            return (
              <div
                key={item.key}
                className={`flex-1 flex items-center justify-center ${
                  activeNavbarKey === item.key
                    ? "font-bold text-cyan-600 font-baloo text-lg"
                    : "font-semibold text-cyan-950 text-sm"
                }`}
                onClick={() => setActiveNavbarKey(item.key)}
              >
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>

        <div
          id="scrollableDiv"
          className="mt-4 min-h-[calc(100vh-108px)] bg-cyan-100 rounded-t-[24px] border-t-[1px] border-cyan-950 p-4 overflow-auto"
          style={{
            boxShadow: `0px -2px 0px 0px ${colors.cyan950}`,
            maxHeight: "calc(100vh - 108px)",
          }}
        >
          <InfiniteScroll
            dataLength={pointsList.length}
            next={loadMore}
            hasMore={pagination.page >= 1 && pagination.page < pagination.totalPage}
            loader={
              <div className="text-center py-4 text-cyan-600">
                <p>Loading...</p>
              </div>
            }
            endMessage={
              <div className="text-center py-4 text-cyan-600">
                <p>{tCommon("noMoreData")}</p>
              </div>
            }
            scrollableTarget="scrollableDiv"
          >
            {pointsList.map((item, index) => (
              <div key={`${item.createTime}-${index}`} className="mt-1">
                <PointHistoryItem item={item} />
              </div>
            ))}
          </InfiniteScroll>
        </div>
      </main>
    </div>
  );
}
