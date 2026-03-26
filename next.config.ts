import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const require = createRequire(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // 忽略 node_modules 中的测试文件和非标准文件
    config.plugins = config.plugins || [];

    // 使用 IgnorePlugin 排除会导致 Turbopack 错误的文件类型
    const webpack = require("webpack") as {
      IgnorePlugin: new (options: { resourceRegExp: RegExp; contextRegExp?: RegExp }) => unknown;
    };

    config.plugins.push(
      new webpack.IgnorePlugin({
        // 忽略 node_modules 中的测试文件
        resourceRegExp: /\.(test|spec)\.(ts|tsx|js|jsx)$/,
        contextRegExp: /node_modules/,
      }),
      new webpack.IgnorePlugin({
        // 忽略 node_modules 中的 markdown、zip、shell 脚本等
        resourceRegExp: /\.(md|zip|sh|yml|yaml)$/,
        contextRegExp: /node_modules/,
      }),
      // 忽略 React Native 的 async-storage 包（浏览器环境不需要）
      // 解决 @metamask/sdk 在 Vercel 构建时的依赖问题
      new webpack.IgnorePlugin({
        resourceRegExp: /@react-native-async-storage\/async-storage/,
      }),
    );

    // 为浏览器环境添加 fallback，防止 React Native 包的导入错误
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "@react-native-async-storage/async-storage": false,
      };
    }

    return config;
  },
  allowedDevOrigins: [
    'localhost:3000',
    '*.ngrok-free.app'
  ]
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
export default withNextIntl(nextConfig);
