#!/bin/bash

# Docker 镜像构建脚本
# 使用方法: ./scripts/build-docker.sh [tag]
# 示例: ./scripts/build-docker.sh v1.0.0

set -e  # 遇到错误立即退出

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 获取镜像标签，默认为 latest
IMAGE_TAG=${1:-latest}
IMAGE_NAME="abdao-pet"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🐳 Docker 镜像构建流程${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "镜像名称: ${IMAGE_NAME}:${IMAGE_TAG}"
echo "构建时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装，请先安装 Docker${NC}"
    echo "   安装指南: https://docs.docker.com/get-docker/"
    exit 1
fi

# 检查 Docker 服务是否运行
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker 服务未运行，请启动 Docker${NC}"
    exit 1
fi

echo -e "${BLUE}📦 步骤 1/2: 构建 Docker 镜像${NC}"
echo "执行: docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
echo ""

# 构建镜像（显示构建过程）
if docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .; then
    echo ""
    echo -e "${GREEN}✅ Docker 镜像构建成功！${NC}"
    echo ""
    
    # 显示镜像信息
    echo -e "${BLUE}📊 镜像信息:${NC}"
    docker images ${IMAGE_NAME}:${IMAGE_TAG} --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    echo ""
    
    # 获取镜像大小
    IMAGE_SIZE=$(docker images ${IMAGE_NAME}:${IMAGE_TAG} --format "{{.Size}}")
    echo -e "${GREEN}📦 镜像大小: ${IMAGE_SIZE}${NC}"
    echo ""
    
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}🎉 构建完成！${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "${YELLOW}📝 后续操作:${NC}"
    echo ""
    echo "1️⃣  本地测试运行:"
    echo "   docker run -p 3000:3000 \\"
    echo "     -e NEXTAUTH_SECRET=your-secret \\"
    echo "     -e TWITTER_CLIENT_ID=your-client-id \\"
    echo "     -e TWITTER_CLIENT_SECRET=your-client-secret \\"
    echo "     ${IMAGE_NAME}:${IMAGE_TAG}"
    echo ""
    echo "2️⃣  后台运行:"
    echo "   docker run -d -p 3000:3000 --name abdao-pet \\"
    echo "     --restart unless-stopped \\"
    echo "     -e NEXTAUTH_SECRET=your-secret \\"
    echo "     ${IMAGE_NAME}:${IMAGE_TAG}"
    echo ""
    echo "3️⃣  导出镜像文件（用于分发）:"
    echo "   ./scripts/export-docker.sh ${IMAGE_TAG}"
    echo ""
    echo "4️⃣  查看容器日志:"
    echo "   docker logs -f abdao-pet"
    echo ""
    echo "5️⃣  查看容器状态:"
    echo "   docker ps | grep abdao-pet"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Docker 镜像构建失败${NC}"
    echo "请检查上方错误信息"
    exit 1
fi
