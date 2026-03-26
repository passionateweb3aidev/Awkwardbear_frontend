import type { AxiosResponse } from "axios";
import { request } from "./request";

// 具体路径/字段以 swagger 为准；这里按首页功能点提供最小联调接口集合

export type PetResponse = {
  petSp: number;
  petStatus: number;
  spentTime: string | null;
};

export type HatchPetResponse = {
  success: boolean;
  [k: string]: unknown;
};

export type LatestFedItem = {
  address: string;
  fedAt?: string; // ISO 8601
};

export type LatestFedResponse = {
  petSp: number;
  petStatus: number;
  spentTime: string | null;
};

export type ResourceResponse = {
  uri: string;
};

export const pet = {
  get: (): Promise<AxiosResponse<PetResponse>> => request.get("/pet"),
  // 和后端确认后，没有这个update接口
  update: (params: { petStatus: number; txHash: string }): Promise<AxiosResponse<PetResponse>> =>
    request.put("/pet", params),
  resource: (): Promise<AxiosResponse<ResourceResponse>> => request.get("/pet/uri"),
  touch: (): Promise<AxiosResponse<LatestFedResponse>> => request.patch("/pet"),
};
