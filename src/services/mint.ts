import type { AxiosResponse } from "axios";
import { request } from "./request";

export const mint = {
  get: (): Promise<AxiosResponse<Record<string, unknown>>> => request.get("/mint"),
  update: (params: {
    tokenId: string;
    txHash: string;
    blockNumber: string;
  }): Promise<AxiosResponse<Record<string, unknown>>> => request.put("/mint", params),
};
