#!/bin/bash

# PM2 重建脚本
# 使用方法: ./scripts/pm2-rebuild.sh
# 或通过 npm: npm run pm2:rebuild

set -e

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🔄 PM2 重建流程${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 步骤 1: 拉取最新代码
echo -e "${BLUE}📥 步骤 1/6: 拉取最新代码${NC}"
if git pull; then
    echo -e "${GREEN}✅ 代码拉取成功${NC}"
else
    echo -e "${RED}❌ 代码拉取失败${NC}"
    exit 1
fi
echo ""

# 步骤 2: 获取当前 PM2 进程 PID
echo -e "${BLUE}🔍 步骤 2/6: 获取当前 PM2 进程 PID${NC}"
PM2_PID=$(pm2 pid ab-pet 2>/dev/null | tr -d ' \n' || echo "")
if [ -n "$PM2_PID" ]; then
    echo "$PM2_PID" > /tmp/pm2_pids.txt
    echo -e "${GREEN}✅ PID 已保存到 /tmp/pm2_pids.txt${NC}"
    echo "当前 PID: $PM2_PID"
    HAS_PID=true
else
    echo -e "${YELLOW}⚠️  未找到运行中的 PM2 进程 (ab-pet)${NC}"
    HAS_PID=false
fi
echo ""

# 步骤 3: 停止 PM2 进程（如果有）
echo -e "${BLUE}🛑 步骤 3/6: 停止 PM2 进程${NC}"
if [ "$HAS_PID" = true ]; then
    if pm2 stop ab-pet 2>/dev/null; then
        echo -e "${GREEN}✅ PM2 进程 (ab-pet) 已停止${NC}"
    else
        echo -e "${YELLOW}⚠️  停止 PM2 进程失败，但继续执行${NC}"
    fi
else
    echo -e "${YELLOW}⏭️  跳过停止步骤（没有运行中的进程）${NC}"
fi
echo ""

# 步骤 4: 安装依赖
echo -e "${BLUE}📦 步骤 4/6: 安装依赖${NC}"
if pnpm i; then
    echo -e "${GREEN}✅ 依赖安装成功${NC}"
else
    echo -e "${RED}❌ 依赖安装失败${NC}"
    exit 1
fi
echo ""

# 步骤 5: 构建项目
echo -e "${BLUE}🔨 步骤 5/6: 构建项目${NC}"
if npm run build; then
    echo -e "${GREEN}✅ 项目构建成功${NC}"
else
    echo -e "${RED}❌ 项目构建失败${NC}"
    exit 1
fi
echo ""

# 步骤 6: 启动 PM2 应用
echo -e "${BLUE}🚀 步骤 6/6: 启动 PM2 应用${NC}"
if npm run pm2:start; then
    echo -e "${GREEN}✅ PM2 应用启动成功${NC}"
else
    echo -e "${RED}❌ PM2 应用启动失败${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ 重建流程完成！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "查看 PM2 状态: pm2 status"
echo "查看 PM2 日志: pm2 logs"
echo "查看保存的 PID: cat /tmp/pm2_pids.txt"
echo ""
