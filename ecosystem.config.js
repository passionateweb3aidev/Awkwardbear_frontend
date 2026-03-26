/**
 * PM2 Ecosystem 配置文件
 * 参考用法: pm2 start ecosystem.config.js
 */

// 这一步让 PM2 在启动前，读取当前目录的 .env 文件并注入到环境变量中
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config();

module.exports = {
  apps: [
    {
      name: "ab-pet",
      script: "pnpm",
      args: "run start",
      cwd: process.cwd(),
      instances: 1,
      exec_mode: "fork",
      // 自动检测 Node.js 路径（如果使用 nvm）
      interpreter: process.env.NODE_PATH || "node",
      // 环境变量配置
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
      // 生产环境配置（使用 pm2 start ecosystem.config.js --env production）
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
      // 日志配置
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      // 自动重启配置
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      // 定时重启（每周日凌晨3点）
      cron_restart: "0 3 * * 0",
      // 最小运行时间（秒），避免频繁重启
      min_uptime: "10s",
      // 最大重启次数
      max_restarts: 10,
      // 重启延迟（毫秒）
      restart_delay: 4000,
      // 健康检查（可选）
      // health_check_grace_period: 3000,
      // 监听文件变化（开发模式）
      watch_options: {
        followSymlinks: false,
      },
      // 忽略监听的文件
      ignore_watch: ["node_modules", ".next", "logs", "*.log"],
    },
  ],
};
