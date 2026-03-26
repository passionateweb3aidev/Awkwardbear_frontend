import type { AxiosResponse } from "axios";
import { request } from "./request";

export type TaskItem = {
  completedCount: number;
  maxCompletion: number;
  rewardPoints: number;
  rewardStatus: number | null;
  taskCode: string;
  taskDesc: string;
  taskDescEn: string;
  taskName: string;
  taskNameEn: string;
  taskType: "ONE_TIME" | "DAILY";
};

export type TaskListResponse = TaskItem[];

export type CompleteTaskRequest = {
  taskCode: string;
  tweetUrl: string;
};

export type CompleteTaskResponse = {
  success: boolean;
  reward?: number;
  [k: string]: unknown;
};

export const task = {
  list: (): Promise<AxiosResponse<TaskListResponse>> => request.get("/task/list", {}),
  details: (): Promise<
    AxiosResponse<{
      criticalImpressionCount: number;
      criticalImpressionPoints: number;
      criticalLikeCount: number;
      criticalLikePoints: number;
      rewardPoints: number;
    }>
  > => request.get("/task/giftDetails", {}),

  dailyGiftRecords: (): Promise<
    AxiosResponse<
      {
        completeTime: number;
        tweetStatus: number;
        changePoints: number;
        description: string;
        url: string;
      }[]
    >
  > => request.get("/task/dailyGiftRecords", {}),

  complete: (body: CompleteTaskRequest): Promise<AxiosResponse<CompleteTaskResponse>> =>
    request.put("/task", body),

  claim: (body: {
    taskCode: string;
    tweetUrl?: string;
  }): Promise<AxiosResponse<CompleteTaskResponse>> => request.patch("/task", body),
};
