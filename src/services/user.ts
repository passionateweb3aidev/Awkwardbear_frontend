import type { AxiosResponse } from "axios";
import { request } from "./request";
import { UserMeResponse } from "./auth";

export type UserPointType = "TASK_REWARD" | "INVITE_REWARD" | "MINING_REWARD" | "";

export type UserPointsParams = {
  page: number;
  pageSize: number;
  pointType?: UserPointType;
};

export type UserPointItem = {
  changePoints: number;
  createTime: string;
  pointDesc: string;
  pointType: UserPointType;
  taskCode: string;
};

export type UserPointsResponse = {
  current: number;
  pages: number;
  records: UserPointItem[];
  size: number;
  total: number;
};

export const user = {
  me: (): Promise<AxiosResponse<UserMeResponse>> => request.get("/user"),
  bar: (): Promise<AxiosResponse<string[]>> => request.get("/user/bar"),
  points: (params: UserPointsParams): Promise<AxiosResponse<UserPointsResponse>> =>
    request.get("/user/points", { params }),
};
