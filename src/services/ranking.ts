import type { AxiosResponse } from "axios";
import { request } from "./request";
import { WalletType } from "./auth";

export type RankUser = {
  id: string;
  photoUrl: string;
  rank: number;
  totalPoints: number;
  username: string;
  walletAddress: string;
  walletType: WalletType;
};

export type RankingResponse = {
  top: RankUser[];
  myRanking?: RankUser;
};

export const ranking = {
  get: (userId?: string): Promise<AxiosResponse<RankingResponse>> =>
    request.get("/ranking", { params: { userId } }),
};
