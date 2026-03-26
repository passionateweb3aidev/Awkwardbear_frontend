/**
 * 手动测试文件 - 用于验证环境配置模块
 * 运行此文件以验证 envConfig 导出和日志功能
 */

import fs from "fs";
import path from "path";
import { envConfig, getApiBaseUrl, getEnvironment, getInviteLinkDomain } from "../env";

/**
 * 手动加载 .env.local 环境变量
 * 因为直接用 ts-node 运行此脚本不会通过 Next.js 自动加载环境变量
 */
function loadEnvLocal() {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      console.log("正在加载环境变量: .env.local");
      const content = fs.readFileSync(envPath, "utf-8");

      content.split("\n").forEach((line) => {
        // 忽略注释和空行
        if (!line || line.startsWith("#")) return;

        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          // 处理带引号的值
          let value = match[2].trim();
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }

          process.env[key] = value;
        }
      });
    } else {
      console.log("未找到 .env.local 文件，将使用默认值 (production)");
    }
  } catch (error) {
    console.error("加载环境变量失败:", error);
  }
}

// 在测试开始前先加载环境变量
loadEnvLocal();

console.log("=== 环境配置模块测试 ===\n");

console.log("1. 测试 envConfig 导出:");
console.log("   environment:", envConfig.environment);
console.log("   apiBaseUrl:", envConfig.apiBaseUrl);
console.log("   inviteLinkDomain:", envConfig.inviteLinkDomain);

console.log("\n2. 测试函数调用:");
console.log("   getEnvironment():", getEnvironment());
console.log('   getApiBaseUrl("production"):', getApiBaseUrl("production"));
console.log('   getApiBaseUrl("test"):', getApiBaseUrl("test"));
console.log('   getInviteLinkDomain("production"):', getInviteLinkDomain("production"));
console.log('   getInviteLinkDomain("test"):', getInviteLinkDomain("test"));

console.log("\n3. 验证类型:");
console.log("   envConfig 类型正确:", typeof envConfig === "object");
console.log("   environment 是字符串:", typeof envConfig.environment === "string");
console.log("   apiBaseUrl 是字符串:", typeof envConfig.apiBaseUrl === "string");
console.log("   inviteLinkDomain 是字符串:", typeof envConfig.inviteLinkDomain === "string");

console.log("\n=== 测试完成 ===");
