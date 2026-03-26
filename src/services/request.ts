import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

import { getAccessToken } from "./token";
import { auth } from "./auth";
import { clearTokenPair } from "./token";
import { envConfig } from "@/config/env";

const API_PREFIX = "/api";
const BFF_PREFIX = "/bff";

function ensureApiPrefix(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (!url.startsWith("/")) return `${API_PREFIX}/${url}`;
  // 如果已经是 /bff 或 /api 开头，保持不变
  if (url.startsWith(BFF_PREFIX) || url.startsWith(API_PREFIX)) return url;
  return `${API_PREFIX}${url}`;
}

function getAcceptLanguageHeader(): "zh-CN" | "en-US" {
  if (typeof window === "undefined") return "zh-CN";
  const path = window.location?.pathname ?? "";
  // next-intl 路由是 /en/* 或 /zh/*
  if (path.startsWith("/en")) return "en-US";
  return "zh-CN";
}

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  const normalized = ensureApiPrefix(url);
  return normalized.startsWith(`${API_PREFIX}/auth/`);
}

// Token 刷新相关状态管理
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// 处理登录失效：清除 token，断开钱包连接，刷新页面
async function handleAuthExpired() {
  // 清除 token
  clearTokenPair();

  // 刷新页面重置状态
  // if (typeof window !== "undefined") {
  //   window.location.reload();
  // }
}

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  // 生产环境通过环境变量配置，开发环境默认指向后端地址
  // 如果遇到 CORS 问题，可以在 next.config.ts 配置 rewrites 并改为 "/"
  baseURL: envConfig.apiBaseUrl,
  timeout: 10000, // 10秒超时
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 统一补全 /api 前缀（允许业务侧写 /auth/x 这种短路径）
    // 注意：NextAuth 相关的路由（Twitter 认证）走 /bff/auth/*，由 NextAuth 自己处理
    if (typeof config.url === "string") {
      config.url = ensureApiPrefix(config.url);
    }

    // 国际化：后端根据 Accept-Language 返回中英文提示
    config.headers.set("Accept-Language", getAcceptLanguageHeader());

    // 可以在这里添加 token 等认证信息
    // 规则：除 /auth/* 外，其余接口均需要 Authorization: Bearer {jwt_token}
    if (!isAuthEndpoint(config.url)) {
      const accessToken = getAccessToken();
      if (accessToken && !config.headers.has("Authorization")) {
        config.headers.set("Authorization", `Bearer ${accessToken}`);
      }
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// 响应拦截器
service.interceptors.response.use(
  async (response: AxiosResponse) => {
    // 统一处理返回数据格式: {code: number, data: any}
    const responseData = response.data as { code?: number; data?: unknown };
    const originalRequest = response.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const requestUrl = originalRequest?.url;
    if (responseData.code !== undefined && responseData.code !== 200) {
      if (
        responseData.code === 401 &&
        requestUrl &&
        !isAuthEndpoint(requestUrl) &&
        !originalRequest._retry
      ) {
        if (isRefreshing) {
          // 如果正在刷新 token，将请求加入队列等待
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => {
              // 刷新成功后，重试原始请求
              return service(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // 尝试刷新 token
          await auth.refresh();
          // 直接刷新页面
          window.location.reload();
          // 刷新成功，处理队列中的请求
          processQueue(null);
          // 重试原始请求
          return service(originalRequest);
        } catch (refreshError) {
          // 刷新失败，处理登录失效
          processQueue(refreshError as Error);
          await handleAuthExpired();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // 其他错误码，抛出错误（会进入错误处理流程）
        const error = new Error(`API Error: code ${responseData.code}`) as AxiosError<{
          code: number;
          data?: unknown;
        }>;
        // 构造一个类似 AxiosError 的结构，保持错误处理的一致性
        error.response = {
          ...response,
          data: {
            code: responseData.code,
            data: responseData.data,
          },
        };
        throw error;
      }
    }

    // code === 200 或 code 不存在时，返回 responseData.data
    // 将 response.data 替换为实际的 data 字段，业务代码通过 response.data 访问
    return {
      ...response,
      data: responseData.data,
    };
  },
  async (error: AxiosError) => {
    // 统一错误处理
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // 未授权，可以跳转到登录页
          console.error("未授权，请重新登录");
          break;
        case 403:
          console.error("拒绝访问");
          break;
        case 404:
          console.error("请求地址不存在");
          break;
        case 500:
          console.error("服务器错误");
          break;
        default:
          console.error(`请求失败: ${status}`);
      }
      return Promise.reject(data || error);
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error("网络错误，请检查网络连接");
      return Promise.reject(error);
    } else {
      // 其他错误
      console.error("请求配置错误");
      return Promise.reject(error);
    }
  },
);

// 导出 axios 实例，以便需要时直接使用
export default service;

// 提供一个轻量 request 封装（返回 AxiosResponse，避免业务侧写 axiosInstance.xxx 泛型太冗长）
export const request = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return service.get<T, AxiosResponse<T>>(url, config);
  },
  post<T, D = Record<string, unknown>>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Promise<AxiosResponse<T>> {
    return service.post<T, AxiosResponse<T>, D>(url, data, config);
  },
  put<T, D = Record<string, unknown>>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Promise<AxiosResponse<T>> {
    return service.put<T, AxiosResponse<T>, D>(url, data, config);
  },
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return service.delete<T, AxiosResponse<T>>(url, config);
  },
  patch<T, D = Record<string, unknown>>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Promise<AxiosResponse<T>> {
    return service.patch<T, AxiosResponse<T>, D>(url, data, config);
  },
};
