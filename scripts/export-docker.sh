#!/bin/bash

# Docker 镜像导出脚本
# 使用方法: ./scripts/export-docker.sh [tag] [output_file]
# 示例: ./scripts/export-docker.sh latest abdao-pet-latest.tar.gz

set -e

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 获取参数
IMAGE_TAG=${1:-latest}
OUTPUT_FILE=${2:-abdao-pet-${IMAGE_TAG}.tar.gz}
IMAGE_NAME="abdao-pet:${IMAGE_TAG}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📦 Docker 镜像导出流程${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "镜像名称: ${IMAGE_NAME}"
echo "输出文件: ${OUTPUT_FILE}"
echo "导出时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装${NC}"
    exit 1
fi

# 检查镜像是否存在
if ! docker images ${IMAGE_NAME} --format "{{.Repository}}:{{.Tag}}" | grep -q "^${IMAGE_NAME}$"; then
    echo -e "${YELLOW}⚠️  镜像 ${IMAGE_NAME} 不存在${NC}"
    echo ""
    echo "是否先构建镜像？(y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        ./scripts/build-docker.sh ${IMAGE_TAG}
    else
        echo -e "${RED}❌ 取消导出${NC}"
        exit 1
    fi
fi

echo -e "${BLUE}📦 步骤 1/2: 导出镜像${NC}"
echo "执行: docker save ${IMAGE_NAME} | gzip > ${OUTPUT_FILE}"
echo ""

# 显示进度
echo -n "导出中"
docker save ${IMAGE_NAME} | gzip > ${OUTPUT_FILE} &
PID=$!

# 简单的进度动画
while kill -0 $PID 2>/dev/null; do
    echo -n "."
    sleep 1
done
wait $PID
EXIT_CODE=$?

echo ""

if [ $EXIT_CODE -eq 0 ]; then
    FILE_SIZE=$(du -h ${OUTPUT_FILE} | cut -f1)
    FILE_SIZE_BYTES=$(stat -f%z ${OUTPUT_FILE} 2>/dev/null || stat -c%s ${OUTPUT_FILE})
    FILE_SIZE_MB=$((FILE_SIZE_BYTES / 1024 / 1024))
    
    echo ""
    echo -e "${GREEN}✅ 镜像导出成功！${NC}"
    echo ""
    
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}📊 文件信息${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo "文件名称: ${OUTPUT_FILE}"
    echo "文件路径: $(pwd)/${OUTPUT_FILE}"
    echo "文件大小: ${FILE_SIZE} (${FILE_SIZE_MB} MB)"
    echo "MD5校验: $(md5sum ${OUTPUT_FILE} 2>/dev/null || md5 ${OUTPUT_FILE} | awk '{print $4}')"
    echo ""
    
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}🚀 使用指南${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo "1️⃣  传输到服务器:"
    echo "   scp ${OUTPUT_FILE} user@server:/tmp/"
    echo ""
    echo "2️⃣  在服务器上导入镜像:"
    echo "   gunzip -c ${OUTPUT_FILE} | docker load"
    echo "   或"
    echo "   docker load < ${OUTPUT_FILE}"
    echo ""
    echo "3️⃣  查看导入的镜像:"
    echo "   docker images | grep abdao-pet"
    echo ""
    echo "4️⃣  运行容器（需要配置环境变量）:"
    echo "   docker run -d -p 3000:3000 --name abdao-pet \\"
    echo "     --restart unless-stopped \\"
    echo "     -e NODE_ENV=production \\"
    echo "     -e NEXTAUTH_SECRET=your-secret-here \\"
    echo "     -e NEXTAUTH_URL=https://yourdomain.com \\"
    echo "     -e TWITTER_CLIENT_ID=your-client-id \\"
    echo "     -e TWITTER_CLIENT_SECRET=your-client-secret \\"
    echo "     ${IMAGE_NAME}"
    echo ""
    echo "5️⃣  查看容器状态和日志:"
    echo "   docker ps | grep abdao-pet"
    echo "   docker logs -f abdao-pet"
    echo ""
    
    echo -e "${YELLOW}💡 提示:${NC}"
    echo "• 镜像文件可以通过 scp/rsync/云存储等方式分发"
    echo "• 建议妥善保存环境变量，不要在命令历史中暴露"
    echo "• 生产环境建议使用反向代理(Nginx/Caddy)处理 HTTPS"
    echo ""
else
    echo -e "${RED}❌ 镜像导出失败${NC}"
    exit 1
fi
