"use client";

import Image from "next/image";
import taskArrow from "@/assets/icon/home-task-arrow.png";
import TasksTab from "./components/TasksTab";
import { useMemo, useState } from "react";
import TasksList from "./components/TasksList";
import { TaskItem } from "@/services/task";

interface TasksProps {
  className?: string;
  taskList: TaskItem[];
  giftRewardDetails: {
    criticalImpressionCount: number;
    criticalImpressionPoints: number;
    criticalLikeCount: number;
    criticalLikePoints: number;
    rewardPoints: number;
  };
  handleClickTask: (taskItem: TaskItem) => void;
}

export default function Tasks({
  className = "",
  taskList,
  handleClickTask,
  giftRewardDetails,
}: TasksProps) {
  const [activeTab, setActiveTab] = useState<TaskItem["taskType"]>("DAILY");

  const currentTaskList = useMemo(() => {
    if (taskList.length === 0) {
      return [];
    }
    return taskList
      .filter((task) => task.taskType === activeTab)
      .sort((a, b) => {
        // 将 rewardStatus 为 20 的项目放到最后
        if (a.rewardStatus === 20 && b.rewardStatus !== 20) return 1;
        if (a.rewardStatus !== 20 && b.rewardStatus === 20) return -1;
        return 0;
      });
  }, [taskList, activeTab]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <Image src={taskArrow} alt="tasks" className="w-[24px] h-[24px]" />
      <div className="w-full px-8 mt-2">
        <TasksTab activeTab={activeTab} onChange={setActiveTab} />
      </div>
      <div className="w-full">
        <TasksList
          taskList={currentTaskList}
          handleClickTask={handleClickTask}
          giftRewardDetails={giftRewardDetails}
        />
      </div>
    </div>
  );
}
