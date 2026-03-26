import type { AxiosResponse } from "axios";
import { request } from "./request";

export type TransferPayload = {
  toAddress: string;
  amount: string;
  txHash: string;
  token: string;
  chain: string;
};

export const transfer = {
  create: (body: TransferPayload): Promise<AxiosResponse<Record<string, unknown>>> =>
    request.post("/transfer", body),
};

