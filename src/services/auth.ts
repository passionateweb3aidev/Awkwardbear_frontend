import type { AxiosResponse } from "axios";

import { PetResponse } from "./pet";
import { request } from "./request";
import { clearTokenPair, getAccessToken, getRefreshToken, setTokenPair, TokenPair } from "./token";

// 结合你的路由/JWT说明：
// - 登录：/bff/auth/x 或 /api/auth/wallet （不需要 Authorization）
// - 刷新：/api/auth/refresh（请求头携带 refreshToken）
// 注意：NextAuth 相关的路由（Twitter 认证）走 /bff/auth/*，由 NextAuth 自己处理
// - 其余接口：Authorization: Bearer {accessToken}

export type LoginWithXRequest = {
  // 具体字段以 swagger 为准，这里先按常见 OAuth 登录回调参数预留
  code?: string;
  state?: string;
  redirectUri?: string;
};

/*
MetaMask("Meta_Mask", "MetaMask"),
    Coinbase_Wallet("Coinbase_Wallet", "Coinbase Wallet"),
    WalletConnect("Wallet_Connect", "WalletConnect"),
    Phantom("Phantom", "Phantom"),
    AbWallet("AB_Wallet", "AB Wallet"),
    OkxWallet("OKX_Wallet", "OKX Wallet"),
    BinanceWallet("Binance_Wallet", "Binance Wallet");
*/
export type WalletType =
  | "Meta_Mask"
  | "Coinbase_Wallet"
  | "Wallet_Connect"
  | "Phantom"
  | "AB_Wallet"
  | "OKX_Wallet"
  | "Binance_Wallet"
  | "Unknown";

export type LoginWithWalletRequest = {
  walletType: WalletType;
  address: string;
  inviteCode?: string;
  tgId?: string | number;
  utmSource?: string;
  utmMedium?: string;
};

export type LinkXRequest = {
  id: string;
  username: string;
  photoUrl: string;
  inviteCode: string;
  tgId?: string | number;
  utmSource?: string;
  utmMedium?: string;
};

export type LinkXResponse = UserMeResponse & {
  petInfo?: PetResponse;
};

export type AuthTokensResponse = TokenPair & {
  userInfo: UserMeResponse;
};

export type UserMeResponse = {
  activeStatus: string | null;
  email: string | null;
  id: string;
  inviteCode: string;
  invitePoints: number;
  mobile: string | null;
  petPoints: number;
  photoUrl: string | null;
  taskPoints: number;
  totalPoints: number;
  username: string | null;
  walletAddress: string;
  walletType: WalletType;
  xid: string | null;
};

export const auth = {
  loginWithX: async (payload: LoginWithXRequest): Promise<AxiosResponse<AuthTokensResponse>> => {
    const res = await request.post<AuthTokensResponse, LoginWithXRequest>("/bff/auth/x", payload);
    // 如果后端确实返回 accessToken/refreshToken，则持久化，后续请求会自动带 Authorization
    if (res.data?.accessToken && res.data?.refreshToken) {
      setTokenPair({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      });
    }
    return res;
  },

  linkX: async (
    payload: LinkXRequest,
    accessTokenOverride?: string,
  ): Promise<AxiosResponse<LinkXResponse>> => {
    const token = accessTokenOverride || getAccessToken();
    if (!token) {
      throw new Error("Missing accessToken");
    }
    const res = await request.post<LinkXResponse, LinkXRequest>("/auth/x/linked", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res;
  },

  loginWithWallet: async (
    payload: LoginWithWalletRequest,
  ): Promise<AxiosResponse<AuthTokensResponse>> => {
    const res = await request.post<AuthTokensResponse, LoginWithWalletRequest>(
      "/auth/wallet",
      payload,
    );
    const data = res.data;
    if (data?.accessToken && data?.refreshToken) {
      setTokenPair({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    }
    return res;
  },

  refresh: async (refreshToken?: string): Promise<AxiosResponse<AuthTokensResponse>> => {
    const token = refreshToken ?? getRefreshToken();
    if (!token) {
      // 没有 refreshToken 直接抛错，调用侧决定是否跳转登录
      throw new Error("Missing refreshToken");
    }

    try {
      const res = await request.post<AuthTokensResponse, Record<string, never>>(
        "/auth/refresh",
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data?.accessToken && res.data?.refreshToken) {
        setTokenPair({
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
        });
      } else {
        throw new Error("Refresh token failed");
      }
      return res;
    } catch (error) {
      // 刷新 token 失败，说明用户登录状态已失效
      // 清除 token，断开钱包连接和刷新页面由调用侧处理（request.ts 中的 handleAuthExpired）
      clearTokenPair();
      throw error;
    }
  },

  logout: async (signOut?: () => Promise<unknown>): Promise<void> => {
    const token = getAccessToken();
    if (!token) {
      console.error("Missing accessToken");
      return;
    }
    await request.post<AuthTokensResponse, Record<string, never>>(
      "/auth/logout",
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    clearTokenPair();
    // 清除 NextAuth 会话（推特缓存）
    if (signOut) {
      await signOut();
    }
  },

  me: async (): Promise<AxiosResponse<UserMeResponse>> => {
    return request.get<UserMeResponse>("/user");
  },
};
