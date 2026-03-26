import type { AxiosResponse } from "axios";
import { request } from "./request";

export type TeamCommonItem = {
  id: string;
  username: string;
  photoUrl: string;
  walletAddress: string;
  walletType: string;
  createTime: string;
};

export type TeamInfoItem = TeamCommonItem & {
  activeStatus: number;
};

export type TeamInfoResponse = TeamInfoItem[];

export type TeamSummaryResponse = {
  boundWalletCount: 0;
  activeUserCount: 0;
};

export type TeamPointsItem = TeamCommonItem & {
  points: number;
};

export type TeamPointsResponse = TeamPointsItem[];

export const team = {
  get: (): Promise<AxiosResponse<TeamInfoResponse>> => request.get("/team"),
  summary: (): Promise<AxiosResponse<TeamSummaryResponse>> => request.get("/team/summary"),
  points: (date: string): Promise<AxiosResponse<TeamPointsResponse>> =>
    request.get(`/team/points?date=${date}`),
};
