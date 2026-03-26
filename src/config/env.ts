/**
 * 环境配置模块
 * 负责从环境变量读取配置并提供类型安全的访问接口
 */

/**
 * 环境类型定义
 * - production: 生产环境
 * - test: 测试环境
 */
export type Environment = "production" | "test";

/**
 * 环境配置接口
 */
export interface EnvironmentConfig {
  /** 当前环境 */
  environment: Environment;
  /** API 基础地址 */
  apiBaseUrl: string;
  /** 邀请链接域名 */
  inviteLinkDomain: string;
  /** Telegram Main Mini App bot username */
  telegramBotUsername: string;
}

/**
 * 环境域名映射表
 * 定义每个环境对应的域名
 */
export const ENVIRONMENT_DOMAINS: Record<Environment, string> = {
  production: "https://www.awkwardbear.com",
  test: "https://www.test.awkwardbear.com",
};

export const ENVIRONMENT_TELEGRAM_BOTS: Record<Environment, string> = {
  production: "AwkwardBear_bot",
  test: "Firstbear1_bot",
};

/**
 * 获取当前环境
 * 从 NEXT_PUBLIC_ENVIRONMENT 环境变量读取环境配置
 * 如果未设置或值无效，返回默认值 "production"
 *
 * @returns 当前环境类型
 */
export function getEnvironment(): Environment {
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT;

  // 如果环境变量未设置，使用默认值 "production"
  if (!env) {
    return "production";
  }

  // 验证环境值是否有效
  if (env !== "production" && env !== "test") {
    console.warn(
      `[Environment Config] 警告: NEXT_PUBLIC_ENVIRONMENT 值 "${env}" 无效，` +
        `应为 "production" 或 "test"。使用默认值 "production"。`,
    );
    return "production";
  }

  return env;
}

/**
 * 获取 API 基础地址
 * 优先使用显式设置的 NEXT_PUBLIC_API_BASE_URL
 * 如果未显式设置，则根据环境推导
 *
 * @param environment 当前环境
 * @returns API 基础地址
 */
export function getApiBaseUrl(environment: Environment): string {
  // 显式设置的值优先
  const explicitUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (explicitUrl) {
    return explicitUrl;
  }

  // 根据环境推导
  return ENVIRONMENT_DOMAINS[environment];
}

/**
 * 获取邀请链接域名
 * 优先使用显式设置的 NEXT_PUBLIC_INVITE_LINK_DOMAIN
 * 如果未显式设置，则根据环境推导
 *
 * @param environment 当前环境
 * @returns 邀请链接域名
 */
export function getInviteLinkDomain(environment: Environment): string {
  // 显式设置的值优先
  const explicitDomain = process.env.NEXT_PUBLIC_INVITE_LINK_DOMAIN;
  if (explicitDomain) {
    return explicitDomain;
  }

  // 根据环境推导
  return ENVIRONMENT_DOMAINS[environment];
}

/**
 * 环境配置对象
 * 包含当前环境的所有配置信息
 */
const environment = getEnvironment();

export const envConfig: EnvironmentConfig = {
  environment,
  apiBaseUrl: getApiBaseUrl(environment),
  inviteLinkDomain: getInviteLinkDomain(environment),
  telegramBotUsername: ENVIRONMENT_TELEGRAM_BOTS[environment],
};

/**
 * 在构建时输出环境配置信息
 * 当 NODE_ENV 为 "test" 时跳过日志输出，避免污染测试输出
 */
if (process.env.NODE_ENV !== "test") {
  console.log("[Environment Config] 当前环境配置:");
  console.log(`  环境: ${envConfig.environment}`);
  console.log(`  API 基础地址: ${envConfig.apiBaseUrl}`);
  console.log(`  邀请链接域名: ${envConfig.inviteLinkDomain}`);
  console.log(`  Telegram Bot: ${envConfig.telegramBotUsername}`);
}
